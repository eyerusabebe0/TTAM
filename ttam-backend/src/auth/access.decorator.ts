import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionKey } from '../users/permissions.js';
import { Role } from '../users/user.entity.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePermission } from './permissions.decorator.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

// @Access({ roles: [Role.MANAGER, Role.OWNER], permission: Permission.VIEW_BOOKINGS })
export function Access(options: { roles: Role[]; permission?: PermissionKey }) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard), // order matters: JWT first
    Roles(...options.roles),
    ...(options.permission ? [RequirePermission(options.permission)] : []),
  );
}