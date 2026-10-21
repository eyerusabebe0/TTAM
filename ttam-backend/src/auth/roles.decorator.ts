import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/user.entity.js';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.OWNER)  or  @Roles(Role.MANAGER, Role.OWNER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);