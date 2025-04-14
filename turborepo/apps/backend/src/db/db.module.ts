import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DRIZZLE_INSTANCE, DrizzleProvider } from './drizzle.provider';

@Module({
  imports: [
    ConfigModule, // Import ConfigModule to make ConfigService available
  ],
  providers: [
    Logger, // Provide Logger explicitly if needed, or rely on global scope
    DrizzleProvider,
  ],
  exports: [
    DRIZZLE_INSTANCE, // Export the injection token
    // Or export the provider directly if preferred: DrizzleProvider
  ],
})
export class DbModule {}
