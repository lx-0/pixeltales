import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const Token = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ headers: { authorization: string } }>();

  const token = request.headers.authorization;

  if (!token) {
    throw new UnauthorizedException('No token found in request');
  }

  return token.replace('Bearer ', '');
});
