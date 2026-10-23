import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Access } from '../auth/access.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, User } from '../users/user.entity.js';
import { Message } from './message.entity.js';
import { MessagesService } from './messages.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('messages')
@Access({ roles: [Role.OWNER, Role.MANAGER, Role.AGENT] })
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messages: MessagesService) {}

  @Get('contacts')
  contacts(@CurrentUser() user: User) {
    return this.messages.contacts(user);
  }

  @Get(':peerId')
  conversation(@CurrentUser() user: User, @Param('peerId', ParseIntPipe) peerId: number) {
    return this.messages.conversation(user, peerId);
  }

  @Post(':peerId')
  send(
    @CurrentUser() user: User,
    @Param('peerId', ParseIntPipe) peerId: number,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.messages.send(user, peerId, dto.body);
  }
}
