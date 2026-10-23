import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Access } from '../auth/access.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Permission } from '../users/permissions.js';
import { Role, User } from '../users/user.entity.js';
import { CreateManagerDto } from './dto/create-manager.dto.js';
import { TogglePermissionDto } from './dto/toggle-permission.dto.js';
import { TeamService } from './team.service.js';

@Controller('managers')
export class ManagersController {
  constructor(@Inject(TeamService) private readonly team: TeamService) {}

  @Get()
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_MANAGERS })
  list() {
    return this.team.listManagers();
  }

  @Post()
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_MANAGERS })
  create(@CurrentUser() actor: User, @Body() dto: CreateManagerDto) {
    return this.team.createManager(dto, actor.role === Role.OWNER);
  }

  @Patch(':id/approve')
  @Access({ roles: [Role.OWNER] })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.team.approveManager(id);
  }
  @Patch(':id/deactivate')
  @Access({ roles: [Role.OWNER] })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.team.setManagerActive(id, false);
  }
  @Patch(':id/activate')
  @Access({ roles: [Role.OWNER] })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.team.setManagerActive(id, true);
  }
  @Patch(':id/permissions')
  @Access({ roles: [Role.OWNER] })
  setPermission(@Param('id', ParseIntPipe) id: number, @Body() dto: TogglePermissionDto) {
    return this.team.setPermission(id, Role.MANAGER, dto);
  }
}