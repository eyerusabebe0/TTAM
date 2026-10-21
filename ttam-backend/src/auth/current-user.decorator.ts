import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/user.entity.js';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  return ctx.switchToHttp().getRequest().user;
});