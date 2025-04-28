import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { UsersDbModule } from '@yesterday-ai/user-database';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseStrategy } from './supabase.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase' }), UsersDbModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseStrategy,
    // Provide the SupabaseAuthGuard as a global guard
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
