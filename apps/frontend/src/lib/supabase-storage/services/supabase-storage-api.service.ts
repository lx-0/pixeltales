import { BaseApiService } from '@/lib/api/base-api';

/**
 * Service for scene-related API requests
 */
export class SupabaseStorageApi extends BaseApiService {
  constructor() {
    super(SupabaseStorageApi.constructor.name);
  }

  async getFile(url: string): Promise<Blob> {
    return this.get(url, {
      responseType: 'blob',
    });
  }
}

// Export singleton instance
export const supabaseStorageApi = new SupabaseStorageApi();
