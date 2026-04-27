import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthedRequest } from '../guards/supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user;
  },
);
