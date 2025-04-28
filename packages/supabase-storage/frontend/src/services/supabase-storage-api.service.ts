import { BaseApiService, IBaseApiServiceOptions } from '@yesterday-ai/api-frontend';

/**
 * Service for scene-related API requests
 */
export class SupabaseStorageApi extends BaseApiService {
  constructor(options: IBaseApiServiceOptions) {
    super(SupabaseStorageApi.constructor.name, options);
  }

  async getFile(url: string): Promise<Blob> {
    return this.get(url, {
      responseType: 'blob',
    });
  }
}
