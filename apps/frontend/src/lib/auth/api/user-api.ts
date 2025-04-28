import { BaseApiService } from '@/lib/api';
import { CreateUserDTO } from '@pixeltales/contracts';
import { ApiResponseSchema } from '@yesterday-ai/api-contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import { User, UserSchema } from '@yesterday-ai/user-contracts';

/**
 * Service for user-related API requests
 */
export class UserApiService extends BaseApiService {
  constructor() {
    super('UserApi');
  }

  /**
   * Sync user profile with backend (find or create)
   */
  async syncProfile(userData: CreateUserDTO): Promise<User> {
    Logger.info('UserApi', `Syncing profile for user: ${userData.email}`);

    // Use the post method with response validation
    // Expecting the backend to return the full User object in the 'data' field of ApiResponse
    const result = await this.post(
      '/me/sync', // Target the new endpoint
      userData,
      undefined,
      ApiResponseSchema(UserSchema), // Expect ApiResponse<User>
    );

    // Extract the user data from the ApiResponse
    if (!result.success || !result.data) {
      Logger.error('UserApi', '❌ Sync profile failed or returned no data', result);
      throw new Error(result.error || 'Failed to sync user profile');
    }

    return result.data; // Return the validated User object
  }

  // Add other user-related API methods here later (e.g., get specific user profile)
}

// Export singleton instance
export const userApi = new UserApiService();
