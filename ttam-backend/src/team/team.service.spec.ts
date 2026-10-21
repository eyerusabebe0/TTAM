import { describe, expect, it, vi } from 'vitest';
import { Permission } from '../users/permissions.js';
import { Role } from '../users/user.entity.js';
import { TeamService } from './team.service.js';

describe('TeamService agent activation', () => {
  it.each([true, false])('sets agent active state to %s', async (isActive) => {
    const agent = { id: 12, role: Role.AGENT };
    const users = {
      findByIdAndRole: vi.fn().mockResolvedValue(agent),
      update: vi.fn().mockResolvedValue({ ...agent, isActive }),
    };
    const service = new TeamService(users as never);

    await expect(service.setAgentActive(agent.id, isActive)).resolves.toMatchObject({ id: agent.id, isActive });
    expect(users.findByIdAndRole).toHaveBeenCalledWith(agent.id, Role.AGENT);
    expect(users.update).toHaveBeenCalledWith(agent.id, { isActive });
  });

  it('does not update a non-existent agent', async () => {
    const users = {
      findByIdAndRole: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    };
    const service = new TeamService(users as never);

    await expect(service.setAgentActive(12, false)).rejects.toThrow('Agent not found.');
    expect(users.update).not.toHaveBeenCalled();
  });

  it('allows the owner to grant managers booking approval access', async () => {
    const manager = { id: 4, role: Role.MANAGER, permissions: { viewBookings: true } };
    const users = {
      findByIdAndRole: vi.fn().mockResolvedValue(manager),
      update: vi.fn().mockResolvedValue({
        ...manager,
        permissions: { ...manager.permissions, [Permission.APPROVE_BOOKINGS]: true },
      }),
    };
    const service = new TeamService(users as never);

    await expect(service.setPermission(manager.id, Role.MANAGER, {
      permission: Permission.APPROVE_BOOKINGS,
      enabled: true,
    })).resolves.toMatchObject({
      permissions: { viewBookings: true, approveBookings: true },
    });
  });
});
