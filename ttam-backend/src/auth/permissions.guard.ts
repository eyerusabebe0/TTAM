import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserStatus } from '../users/user.entity.js';
import { PERMISSION_KEY } from './permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('You do not have access to this action.');

    // The owner can do everything
    if (user.role === Role.OWNER) return true;

    // Pending accounts (not yet approved) can't use any permission
    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Your account is still awaiting approval.');
    }

    if (user.permissions?.[required] !== true) {
      throw new ForbiddenException('Your manager has not granted you this access.');
    }
    return true;
  }
}