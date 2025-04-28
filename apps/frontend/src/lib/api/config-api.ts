import { ConfigOptions, ConfigOptionsSchema } from '@pixeltales/contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import { BaseApiService } from './base-api';

/**
 * Service for configuration-related API requests
 */
export class ConfigApiService extends BaseApiService {
  constructor() {
    super('ConfigApi');
  }

  /**
   * Get application configuration
   */
  async getConfig(): Promise<ConfigOptions> {
    Logger.info('ConfigApi', 'Fetching application configuration');

    return this.get('/config', undefined, ConfigOptionsSchema);
  }
}

// Export singleton instance
export const configApi = new ConfigApiService();
