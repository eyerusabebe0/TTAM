import { describe, expect, it, vi } from 'vitest';
import { Role, User, UserStatus } from '../users/user.entity.js';
import { Message } from './message.entity.js';
import { MessagesService } from './messages.service.js';

function createService(peer: Partial<User>) {
  const savedMessages = {
    create: vi.fn((message: Partial<Message>) => message),
    save: vi.fn(async (message: Partial<Message>) => ({ ...message, id: 8, createdAt: new Date() })),
  };
  const users = {
    findOneBy: vi.fn().mockResolvedValue(peer),
    find: vi.fn().mockResolvedValue([]),
  };
  return {
    service: new MessagesService(savedMessages as never, users as never),
    savedMessages,
  };
}

const manager = { id: 2, role: Role.MANAGER, status: UserStatus.APPROVED, isActive: true } as User;
const agent = { id: 3, role: Role.AGENT, status: UserStatus.APPROVED, isActive: true } as User;
const owner = { id: 1, role: Role.OWNER, status: UserStatus.APPROVED, isActive: true } as User;

describe('MessagesService', () => {
  it('lists the owner and agent as available contacts for a manager', async () => {
    const ownerContact = { id: owner.id, name: 'Jane Owner', role: owner.role, status: UserStatus.PENDING, isActive: false } as User;
    const agentContact = { id: agent.id, name: 'Alex Agent', role: agent.role, status: UserStatus.APPROVED, isActive: true } as User;
    const users = {
      findOneBy: vi.fn(),
      find: vi.fn()
        .mockResolvedValueOnce([agentContact])
        .mockResolvedValueOnce([ownerContact]),
    };
    const service = new MessagesService({ create: vi.fn(), save: vi.fn() } as never, users as never);

    await expect(service.contacts(manager)).resolves.toEqual([
      { id: agentContact.id, name: agentContact.name, role: agentContact.role },
      { id: ownerContact.id, name: ownerContact.name, role: ownerContact.role },
    ]);
    expect(users.find).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { role: Role.AGENT, status: UserStatus.APPROVED, isActive: true },
    }));
    expect(users.find).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { role: Role.OWNER },
    }));
  });

  it('stores a manager-to-agent message for the agent to retrieve', async () => {
    const { service, savedMessages } = createService(agent);

    await expect(service.send(manager, agent.id, '  Please review this booking.  '))
      .resolves.toMatchObject({ senderId: manager.id, recipientId: agent.id, body: 'Please review this booking.' });
    expect(savedMessages.save).toHaveBeenCalledOnce();
  });

  it('allows owner-to-manager conversations', async () => {
    const { service } = createService(manager);

    await expect(service.send(owner, manager.id, 'Please review the weekly report.'))
      .resolves.toMatchObject({ senderId: owner.id, recipientId: manager.id });
  });

  it('allows manager-to-owner conversations', async () => {
    const inactiveOwner = { ...owner, status: UserStatus.PENDING, isActive: false };
    const { service } = createService(inactiveOwner);

    await expect(service.send(manager, owner.id, 'Please approve this budget.'))
      .resolves.toMatchObject({ senderId: manager.id, recipientId: owner.id });
  });

  it('rejects owner-to-agent conversations', async () => {
    const { service, savedMessages } = createService(agent);

    await expect(service.send(owner, agent.id, 'Not an allowed route.')).rejects.toThrow('Contact not found.');
    expect(savedMessages.save).not.toHaveBeenCalled();
  });
});
