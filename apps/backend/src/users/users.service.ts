import { Injectable } from '@nestjs/common';
import { CreateUserDTO } from '@pixeltales/contracts';
import { NewUser, User } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { UsersDbService } from './users-db.service';

/**
 * Service for managing users
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersDb: UsersDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  /**
   * Check if an email belongs to an admin (based on domain)
   */
  private isAdminEmail(email: string): boolean {
    return email.endsWith('@yesterday-ai.de');
  }

  /**
   * Create a new user or update if exists
   */
  async createOrUpdateUser(userData: NewUser): Promise<User | null> {
    this.logger.info(`Creating or updating user with email: ${userData.email}`);

    // Determine role based on email domain
    const role = this.isAdminEmail(userData.email) ? 'admin' : 'user';

    try {
      // Check if user already exists
      const existingUser = await this.findById(userData.id);

      if (existingUser) {
        this.logger.info(`Updating existing user: ${userData.id}`);
        return this.update(userData.id, {
          ...userData,
          role, // Always update role in case email changed
        });
      }

      // Create new user
      return await this.usersDb.create({
        id: userData.id,
        email: userData.email,
        name: userData.name || null,
        role,
      });
    } catch (error) {
      this.logger.error('Failed to create or update user', error);
      throw new Error(
        `Failed to create or update user: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Finds a user by ID, or creates them if they don't exist.
   * Used for syncing Supabase auth users with the backend DB.
   */
  async findOrCreateUser(userData: CreateUserDTO): Promise<User> {
    this.logger.info(`Finding or creating user: ${userData.email}`);
    let user = await this.findById(userData.id);

    if (user) {
      this.logger.info(`User found: ${userData.id}. Checking for updates...`);
      // Update name/email if changed?
      // Potentially check if name needs update:
      if (userData.name && user.name !== userData.name) {
        user = await this.update(user.id, { name: userData.name });
        if (!user) {
          throw new Error('Failed to update user name');
        }
      }
      if (userData.email && user.email !== userData.email) {
        user = await this.update(user.id, { email: userData.email });
        if (!user) {
          throw new Error('Failed to update user email');
        }
      }
      return user;
    } else {
      this.logger.info(`User not found, creating new user: ${userData.id}`);
      // Determine role based on email domain
      const role = this.isAdminEmail(userData.email) ? 'admin' : 'user';
      const newUser: NewUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name || null, // Use DTO name, default null
        role,
      };
      const createdUser = await this.usersDb.create(newUser);
      if (!createdUser) {
        // Handle the case where creation might fail (though usersDb.create should handle errors)
        this.logger.error(`Failed to create user after check for user ID: ${userData.id}`);
        throw new Error('User creation failed during findOrCreate operation');
      }
      return createdUser;
    }
  }

  /**
   * Find a user by their ID
   */
  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id}`);

    try {
      return await this.usersDb.findById(id);
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${id}`, error);
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Find a user by their email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);

    try {
      return await this.usersDb.findByEmail(email);
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email}`, error);
      throw new Error(
        `Failed to find user by email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    updateData: Partial<Pick<NewUser, 'role' | 'email' | 'name'>>,
  ): Promise<User | null> {
    this.logger.info(`Updating user: ${id}`);

    try {
      // Führe das Update durch und setze updatedAt direkt im Abfrage-Statement
      return await this.usersDb.update(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to update user: ${id}`, error);
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
