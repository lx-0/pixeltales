import { ConfigOptions, ConfigOptionsSchema } from '@pixeltales/contracts';
import { BaseApiService, IBaseApiServiceOptions } from '@yesterday-ai/api-frontend';
import { Logger } from '@yesterday-ai/logger-frontend';

/**
 * Service for configuration-related API requests
 */
export class ConfigApiService extends BaseApiService {
  constructor(options?: IBaseApiServiceOptions) {
    super('ConfigApi', options);
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
