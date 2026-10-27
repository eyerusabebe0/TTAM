import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, User, UserStatus } from '../users/user.entity.js';
import { Message } from './message.entity.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async contacts(user: User) {
    this.assertAccountActive(user);
    if (user.role === Role.OWNER) return [];

    const eligibleRole = user.role === Role.MANAGER ? Role.AGENT : Role.MANAGER;
    const eligibleUsers = await this.users.find({
      where: { role: eligibleRole, status: UserStatus.APPROVED, isActive: true },
      select: { id: true, name: true, role: true },
      order: { name: 'ASC' },
    });
    return eligibleUsers.map(({ id, name, role: contactRole }) => ({ id, name, role: contactRole }));
  }

  async conversation(user: User, peerId: number) {
    await this.assertConversationAllowed(user, peerId);
    return this.messages.createQueryBuilder('message')
      .where(
        '(message.senderId = :userId AND message.recipientId = :peerId) OR (message.senderId = :peerId AND message.recipientId = :userId)',
        { userId: user.id, peerId },
      )
      .orderBy('message.createdAt', 'ASC')
      .addOrderBy('message.id', 'ASC')
      .getMany();
  }

  async send(user: User, peerId: number, body: string) {
    await this.assertConversationAllowed(user, peerId);
    const text = body.trim();
    if (!text) throw new BadRequestException('A message cannot be empty.');
    return this.messages.save(this.messages.create({
      senderId: user.id,
      recipientId: peerId,
      body: text,
    }));
  }

  private async assertConversationAllowed(user: User, peerId: number) {
    this.assertAccountActive(user);
    if (!Number.isSafeInteger(peerId) || peerId === user.id) {
      throw new NotFoundException('Contact not found.');
    }
    const peer = await this.users.findOneBy({ id: peerId });
    if (
      !peer ||
      !this.isAllowedPair(user.role, peer.role) ||
      (peer.role !== Role.OWNER && (peer.isActive === false || peer.status !== UserStatus.APPROVED))
    ) {
      throw new NotFoundException('Contact not found.');
    }
    return peer;
  }

  private assertAccountActive(user: User) {
    if (
      user.isActive === false ||
      (user.role !== Role.OWNER && user.status !== UserStatus.APPROVED) ||
      ![Role.MANAGER, Role.AGENT].includes(user.role)
    ) {
      throw new ForbiddenException('Your account cannot use workspace messages.');
    }
  }

  private isAllowedPair(first: Role, second: Role) {
    return (first === Role.MANAGER && second === Role.AGENT)
      || (first === Role.AGENT && second === Role.MANAGER);
  }
}
