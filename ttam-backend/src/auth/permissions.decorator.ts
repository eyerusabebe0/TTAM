import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../users/permissions.js';

export const PERMISSION_KEY = 'permission';

// Usage: @RequirePermission(Permission.VIEW_BOOKINGS)
export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(PERMISSION_KEY, permission);