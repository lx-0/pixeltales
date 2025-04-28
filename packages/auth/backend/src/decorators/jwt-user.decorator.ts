import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@yesterday-ai/user-contracts';

export type JwtUser = {
  profile: User;
  user: SupabaseUser;
};

export const JwtUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();

  if (!request.user) {
    throw new UnauthorizedException('No user found in request');
  }

  return request.user;
});
