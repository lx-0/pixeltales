import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderId } from '@yesterday-ai/llm-contracts';
import { PinoLogger } from 'nestjs-pino';

interface TokenCost {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

// Model pricing structure (USD per 1M tokens)
// These are approximate rates and should be updated as pricing changes
interface ModelPricing {
  inputPrice: number; // USD per 1M input tokens
  outputPrice: number; // USD per 1M output tokens
}

// Define a record structure for usage tracking
interface UsageRecord {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

@Injectable()
export class CostTrackerService implements OnModuleInit {
  // Model pricing in USD per 1M tokens
  private modelPricing: Record<string, ModelPricing> = {
    // OpenAI models
    'gpt-4o': { inputPrice: 5, outputPrice: 15 },
    'gpt-4-turbo': { inputPrice: 10, outputPrice: 30 },
    'gpt-4': { inputPrice: 30, outputPrice: 60 },
    'gpt-3.5-turbo': { inputPrice: 0.5, outputPrice: 1.5 },

    // Anthropic models
    'claude-3-opus': { inputPrice: 15, outputPrice: 75 },
    'claude-3-sonnet': { inputPrice: 3, outputPrice: 15 },
    'claude-3-haiku': { inputPrice: 0.25, outputPrice: 1.25 },
  };

  // Default pricing if no match is found
  private defaultPricing: ModelPricing = { inputPrice: 0.5, outputPrice: 1.5 };

  // Usage tracking
  private totalUsageByModel: Record<
    string,
    { inputTokens: number; outputTokens: number; cost: number }
  > = {};
  private dailyUsage: Record<string, UsageRecord> = {};
  private monthlyUsage: Record<string, UsageRecord> = {};

  // Budget control
  private dailyBudgetLimit: number | null = null;
  private monthlyBudgetLimit: number | null = null;
  private dailyCostTotal = 0;
  private monthlyCostTotal = 0;
  private isOverBudget = false;

  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('CostTrackerService');

    // Initialize budget limits from config if available
    this.dailyBudgetLimit = this.configService.get<number>('LLM_DAILY_BUDGET_LIMIT') || null;
    this.monthlyBudgetLimit = this.configService.get<number>('LLM_MONTHLY_BUDGET_LIMIT') || null;

    // Log budget limits if set
    if (this.dailyBudgetLimit) {
      this.logger.info(`Daily budget limit set to $${this.dailyBudgetLimit}`);
    }
    if (this.monthlyBudgetLimit) {
      this.logger.info(`Monthly budget limit set to $${this.monthlyBudgetLimit}`);
    }

    // Reset daily usage at midnight
    this.scheduleResetDailyUsage();

    // Reset monthly usage on the 1st of each month
    this.scheduleResetMonthlyUsage();
  }

  onModuleInit() {
    this.logger.info('CostTrackerService initialized');
  }

  /**
   * Calculate the cost for a specific token usage and model
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): TokenCost {
    // Determine pricing tier - use exact match or partial match
    const exactPricing = this.modelPricing[model];
    let pricing: ModelPricing;

    if (exactPricing) {
      pricing = exactPricing;
    } else {
      // Try to find a pricing match based on model name prefix
      const modelKey = Object.keys(this.modelPricing).find((key) =>
        model.toLowerCase().includes(key.toLowerCase()),
      );

      if (modelKey && this.modelPricing[modelKey]) {
        pricing = this.modelPricing[modelKey];
      } else {
        // Default fallback pricing
        this.logger.warn(`No pricing found for model ${model}, using default pricing`);
        pricing = this.defaultPricing;
      }
    }

    // Calculate costs in USD
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPrice;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPrice;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalCost,
    };
  }

  /**
   * Track usage and cost for an LLM request
   * Returns the calculated cost and whether the budget limit has been exceeded
   */
  trackUsage(
    provider: LlmProviderId,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): { cost: TokenCost; isOverBudget: boolean } {
    // Skip tracking if token counts are invalid
    if (inputTokens < 0 || outputTokens < 0) {
      this.logger.warn(`Invalid token counts: input=${inputTokens}, output=${outputTokens}`);
      return {
        cost: { inputTokens: 0, outputTokens: 0, totalCost: 0 },
        isOverBudget: this.isOverBudget,
      };
    }

    // Calculate cost
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    // Update model-specific usage
    const modelKey = `${provider}:${model}`;
    if (!this.totalUsageByModel[modelKey]) {
      this.totalUsageByModel[modelKey] = {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      };
    }

    // Update usage statistics
    this.totalUsageByModel[modelKey].inputTokens += inputTokens;
    this.totalUsageByModel[modelKey].outputTokens += outputTokens;
    this.totalUsageByModel[modelKey].cost += cost.totalCost;

    // Update daily and monthly usage
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (!todayStr) {
      this.logger.warn('Could not generate date string for usage tracking');
      return { cost, isOverBudget: this.isOverBudget };
    }

    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    if (!this.dailyUsage[todayStr]) {
      this.dailyUsage[todayStr] = { inputTokens: 0, outputTokens: 0, totalCost: 0 };
    }
    const dailyRecord = this.dailyUsage[todayStr];
    if (dailyRecord) {
      dailyRecord.inputTokens += inputTokens;
      dailyRecord.outputTokens += outputTokens;
      dailyRecord.totalCost += cost.totalCost;
    }

    if (!this.monthlyUsage[monthStr]) {
      this.monthlyUsage[monthStr] = { inputTokens: 0, outputTokens: 0, totalCost: 0 };
    }
    const monthlyRecord = this.monthlyUsage[monthStr];
    if (monthlyRecord) {
      monthlyRecord.inputTokens += inputTokens;
      monthlyRecord.outputTokens += outputTokens;
      monthlyRecord.totalCost += cost.totalCost;
    }

    // Update running totals
    this.dailyCostTotal = dailyRecord?.totalCost || 0;
    this.monthlyCostTotal = monthlyRecord?.totalCost || 0;

    // Check budget limits
    this.checkBudgetLimits();

    // Log usage at appropriate level
    this.logger.debug(
      {
        provider,
        model,
        inputTokens,
        outputTokens,
        cost: cost.totalCost.toFixed(5),
        dailyTotal: this.dailyCostTotal.toFixed(5),
        monthlyTotal: this.monthlyCostTotal.toFixed(5),
      },
      `LLM usage tracked`,
    );

    return { cost, isOverBudget: this.isOverBudget };
  }

  /**
   * Check if current usage exceeds budget limits
   */
  private checkBudgetLimits() {
    const previousOverBudget = this.isOverBudget;
    const isOverDailyBudget =
      this.dailyBudgetLimit !== null && this.dailyCostTotal > this.dailyBudgetLimit;
    const isOverMonthlyBudget =
      this.monthlyBudgetLimit !== null && this.monthlyCostTotal > this.monthlyBudgetLimit;

    this.isOverBudget = isOverDailyBudget || isOverMonthlyBudget;

    // Log warning if we just exceeded budget
    if (!previousOverBudget && this.isOverBudget) {
      if (isOverDailyBudget) {
        this.logger.warn(
          `Daily budget limit of $${this.dailyBudgetLimit} exceeded! Current: $${this.dailyCostTotal.toFixed(2)}`,
        );
      }
      if (isOverMonthlyBudget) {
        this.logger.warn(
          `Monthly budget limit of $${this.monthlyBudgetLimit} exceeded! Current: $${this.monthlyCostTotal.toFixed(2)}`,
        );
      }
    }

    return this.isOverBudget;
  }

  /**
   * Get usage report for a specific day
   */
  getDailyUsage(day?: string): UsageRecord {
    const date = day || new Date().toISOString().split('T')[0] || '';
    return this.dailyUsage[date] || { inputTokens: 0, outputTokens: 0, totalCost: 0 };
  }

  /**
   * Get usage report for a specific month
   */
  getMonthlyUsage(month?: string): UsageRecord {
    const monthKey = month || new Date().toISOString().substring(0, 7) || '';
    return this.monthlyUsage[monthKey] || { inputTokens: 0, outputTokens: 0, totalCost: 0 };
  }

  /**
   * Get model-specific usage breakdown
   */
  getModelUsage(): Record<string, { inputTokens: number; outputTokens: number; cost: number }> {
    return { ...this.totalUsageByModel };
  }

  /**
   * Get overall usage summary
   */
  getUsageSummary() {
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const monthStr = todayStr.substring(0, 7);

    return {
      dailyUsage: this.getDailyUsage(todayStr),
      monthlyUsage: this.getMonthlyUsage(monthStr),
      budgetLimits: {
        daily: this.dailyBudgetLimit,
        monthly: this.monthlyBudgetLimit,
      },
      isOverBudget: this.isOverBudget,
      models: this.getModelUsage(),
    };
  }

  /**
   * Schedule daily usage reset
   */
  private scheduleResetDailyUsage() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilReset = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      // Save current day's usage for history before resetting
      const todayStr = new Date().toISOString().split('T')[0] || '';

      if (todayStr && this.dailyUsage && todayStr in this.dailyUsage) {
        const dailyUsage = this.dailyUsage[todayStr];

        if (
          dailyUsage &&
          typeof dailyUsage === 'object' &&
          'inputTokens' in dailyUsage &&
          'outputTokens' in dailyUsage
        ) {
          this.logger.info(
            {
              date: todayStr,
              tokens: {
                input: dailyUsage.inputTokens,
                output: dailyUsage.outputTokens,
              },
              cost:
                typeof dailyUsage.totalCost === 'number'
                  ? dailyUsage.totalCost.toFixed(5)
                  : '0.00000',
            },
            'Daily LLM usage summary',
          );
        } else {
          this.logger.info({ date: todayStr }, 'No valid usage data for today');
        }
      } else {
        this.logger.info('No usage tracked for today');
      }

      // Reset daily total
      this.dailyCostTotal = 0;

      // Re-schedule for next day
      this.scheduleResetDailyUsage();
    }, timeUntilReset);
  }

  /**
   * Schedule monthly usage reset
   */
  private scheduleResetMonthlyUsage() {
    const now = new Date();
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const timeUntilReset = firstDayNextMonth.getTime() - now.getTime();

    setTimeout(() => {
      // Save current month's usage for history before resetting
      const monthStr = new Date().toISOString().substring(0, 7) || '';

      if (monthStr && this.monthlyUsage && monthStr in this.monthlyUsage) {
        const monthlyUsage = this.monthlyUsage[monthStr];

        if (
          monthlyUsage &&
          typeof monthlyUsage === 'object' &&
          'inputTokens' in monthlyUsage &&
          'outputTokens' in monthlyUsage
        ) {
          this.logger.info(
            {
              month: monthStr,
              tokens: {
                input: monthlyUsage.inputTokens,
                output: monthlyUsage.outputTokens,
              },
              cost:
                typeof monthlyUsage.totalCost === 'number'
                  ? monthlyUsage.totalCost.toFixed(5)
                  : '0.00000',
            },
            'Monthly LLM usage summary',
          );
        } else {
          this.logger.info({ month: monthStr }, 'No valid usage data for this month');
        }
      } else {
        this.logger.info('No usage tracked for this month');
      }

      // Reset monthly total
      this.monthlyCostTotal = 0;

      // Re-schedule for next month
      this.scheduleResetMonthlyUsage();
    }, timeUntilReset);
  }
}
