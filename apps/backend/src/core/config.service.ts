import { Injectable } from '@nestjs/common';

// TODO: Implement actual configuration loading (e.g., from .env, config files)
// using NestJS ConfigModule or similar.
@Injectable()
export class ConfigService {
  // Placeholder methods - implement actual config retrieval
  get(key: string): any {
    // Example: return process.env[key];
    console.warn(`ConfigService.get(${key}) called - using placeholder`);
    // Provide sensible defaults or throw if critical config is missing
    if (key === 'LLM_API_KEY') return 'dummy_api_key';
    if (key === 'DATABASE_URL') return 'sqlite::memory:';
    return undefined;
  }

  // Example of a typed getter
  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.get(key);
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return defaultValue;
    }
    return num;
  }

  getString(key: string, defaultValue?: string): string | undefined {
    const value = this.get(key);
    // Ensure we return a string or the default
    if (typeof value === 'string') {
      return value;
    }
    // If value is not a string (including undefined, null, or other types),
    // return the defaultValue.
    return defaultValue;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key);
    if (value === undefined || value === null) {
      return defaultValue ?? false;
    }
    return String(value).toLowerCase() === 'true';
  }
}
