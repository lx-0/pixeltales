import { Inject, Injectable } from '@nestjs/common';
import { DbUser, NewDbUser, User, usersTable } from '@pixeltales/database';
import { eq, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseSchema, DRIZZLE_INSTANCE } from '../db/drizzle.provider';

/**
 * Service for managing users
 */
@Injectable()
export class UsersDbService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DatabaseSchema,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersDbService.name);
  }

  /**
   * Konvertiert einen Datenbankbenutzer in die API-Antwort
   */
  public mapUser(dbUser: DbUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }

  async create(userData: NewDbUser): Promise<DbUser> {
    const [insertedUser] = await this.db.insert(usersTable).values(userData).returning();

    if (!insertedUser) {
      this.logger.error('Failed to create user');
      throw new Error('Failed to create user');
    }

    return insertedUser;
  }

  async findById(id: DbUser['id']): Promise<DbUser | null> {
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

    return user || null;
  }

  async findByEmail(email: DbUser['email']): Promise<DbUser | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user || null;
  }

  async update(id: DbUser['id'], updateData: Partial<Omit<DbUser, 'id'>>): Promise<DbUser | null> {
    const [updatedUser] = await this.db
      .update(usersTable)
      .set({ updatedAt: sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`, ...updateData, id: undefined })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) {
      this.logger.error('Failed to update user');
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }
}
