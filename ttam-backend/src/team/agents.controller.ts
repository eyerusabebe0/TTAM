import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Access } from '../auth/access.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { Permission } from '../users/permissions.js';
import { Role, User } from '../users/user.entity.js';
import { InviteAgentDto } from './dto/invite-agent.dto.js';
import { SetAgentCodeDto } from './dto/set-agent-code.dto.js';
import { TogglePermissionDto } from './dto/toggle-permission.dto.js';
import { TeamService } from './team.service.js';

@Controller('agents')
export class AgentsController {
  constructor(
    @Inject(TeamService) private readonly team: TeamService,
    @Inject(BookingsService) private readonly bookings: BookingsService,
  ) {}

  // The logged-in agent's own profile plus live stats (leads, revenue)
  @Get('me')
  @Access({ roles: [Role.AGENT] })
  async me(@CurrentUser() user: User) {
    return { ...user, ...(await this.bookings.agentStats(user.id)) };
  }

  @Post('sub')
  @Access({ roles: [Role.AGENT], permission: Permission.REGISTER_AGENTS })
  invite(@Body() dto: InviteAgentDto) {
    return this.team.inviteSubAgent(dto);
  }

  @Get()
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  list() {
    return this.team.listAgents();
  }

  @Patch(':id/approve')
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.team.approveAgent(id);
  }

  @Patch(':id/deactivate')
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.team.setAgentActive(id, false);
  }

  @Patch(':id/activate')
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.team.setAgentActive(id, true);
  }

  @Patch(':id/code')
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  setCode(@Param('id', ParseIntPipe) id: number, @Body() dto: SetAgentCodeDto) {
    return this.team.setAgentCode(id, dto.code);
  }

  @Patch(':id/permissions')
  @Access({ roles: [Role.OWNER, Role.MANAGER], permission: Permission.REGISTER_AGENTS })
  setPermission(@Param('id', ParseIntPipe) id: number, @Body() dto: TogglePermissionDto) {
    return this.team.setPermission(id, Role.AGENT, dto);
  }
}