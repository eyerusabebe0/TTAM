import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { randomCode } from '../common/random-code.js';
import { AGENT_PERMISSIONS, cleanPermissions, MANAGER_PERMISSIONS } from '../users/permissions.js';
import { Role, UserStatus } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateManagerDto } from './dto/create-manager.dto.js';
import { InviteAgentDto } from './dto/invite-agent.dto.js';
import { TogglePermissionDto } from './dto/toggle-permission.dto.js';

@Injectable()
export class TeamService {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  listManagers() { return this.users.findByRole(Role.MANAGER); }
  listAgents() { return this.users.findByRole(Role.AGENT); }

  async createManager(dto: CreateManagerDto, actorIsOwner: boolean) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('An account with this email already exists.');
    }
    return this.users.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      password: await bcrypt.hash(dto.password, 10),
      role: Role.MANAGER,
      status: UserStatus.PENDING, // can't log in until the owner approves
      // only the owner may hand out permissions at creation time
      permissions: cleanPermissions(actorIsOwner ? dto.permissions : {}, MANAGER_PERMISSIONS),
    });
  }

  async approveManager(id: number) {
    const manager = await this.users.findByIdAndRole(id, Role.MANAGER);
    if (!manager) throw new NotFoundException('Manager not found.');
    return this.users.update(id, { status: UserStatus.APPROVED });
  }

  async setManagerActive(id: number, isActive: boolean) {
    const manager = await this.users.findByIdAndRole(id, Role.MANAGER);
    if (!manager) throw new NotFoundException('Manager not found.');
    return this.users.update(id, { isActive });
  }

  async approveAgent(id: number) {
    const agent = await this.users.findByIdAndRole(id, Role.AGENT);
    if (!agent) throw new NotFoundException('Agent not found.');
    if (agent.status === UserStatus.APPROVED) return agent; // never regenerate an issued code
    return this.users.update(id, { status: UserStatus.APPROVED, code: agent.code || await this.uniqueCode() });
  }

  async setAgentActive(id: number, isActive: boolean) {
    const agent = await this.users.findByIdAndRole(id, Role.AGENT);
    if (!agent) throw new NotFoundException('Agent not found.');
    return this.users.update(id, { isActive });
  }

  async setAgentCode(id: number, code: string) {
    const agent = await this.users.findByIdAndRole(id, Role.AGENT);
    if (!agent) throw new NotFoundException('Agent not found.');
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.users.findByCode(normalizedCode);
    if (existing && existing.id !== id) {
      throw new ConflictException('That agent code is already assigned.');
    }
    return this.users.update(id, { code: normalizedCode });
  }

  async setPermission(id: number, role: Role.AGENT | Role.MANAGER, dto: TogglePermissionDto) {
    const allowed = role === Role.AGENT ? AGENT_PERMISSIONS : MANAGER_PERMISSIONS;
    if (!allowed.includes(dto.permission)) {
      throw new BadRequestException('That permission cannot be set for this account type.');
    }
    const user = await this.users.findByIdAndRole(id, role);
    if (!user) throw new NotFoundException('Account not found.');
    return this.users.update(id, { permissions: { ...user.permissions, [dto.permission]: dto.enabled } });
  }

  async inviteSubAgent(dto: InviteAgentDto) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('An account with this email already exists.');
    }
    return this.users.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      // random unguessable hash: they pick a real password when they sign up with this email
      password: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
      passwordSet: false,
      role: Role.AGENT,
      status: UserStatus.PENDING,
      permissions: {},
    });
  }

  private async uniqueCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = `TTAM-${randomCode(5)}`;
      if (!(await this.users.findByCode(code))) return code;
    }
    throw new InternalServerErrorException('Could not generate an invitation code. Try again.');
  }
}