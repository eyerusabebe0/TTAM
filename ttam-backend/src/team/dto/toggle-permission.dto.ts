// toggle-permission.dto.ts
import { IsBoolean, IsIn } from 'class-validator';
import { Permission } from '../../users/permissions.js';

export class TogglePermissionDto {
  @IsIn(Object.values(Permission)) permission!: string;
  @IsBoolean() enabled!: boolean;
}