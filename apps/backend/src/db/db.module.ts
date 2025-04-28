import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { USER_DB_DI_TOKEN } from '@yesterday-ai/user-database';
import { DRIZZLE_INSTANCE, DrizzleProvider } from './drizzle.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    Logger,
    DrizzleProvider,
    {
      provide: USER_DB_DI_TOKEN,
      useExisting: DRIZZLE_INSTANCE,
    },
  ],
  exports: [DRIZZLE_INSTANCE, USER_DB_DI_TOKEN],
})
export class DbModule {}
