import { Body, Controller, ForbiddenException, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Access } from '../auth/access.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { hasPermission, Permission } from '../users/permissions.js';
import { Role, User, UserStatus } from '../users/user.entity.js';
import { BookingsService } from './bookings.service.js';
import { ApproveBookingDto } from './dto/approve-booking.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';

@Controller('bookings')
export class BookingsController {
  constructor(@Inject(BookingsService) private readonly bookings: BookingsService) {}

  @Post()
  @Access({ roles: [Role.CLIENT] })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user, dto);
  }

  @Get('mine')
  @Access({ roles: [Role.CLIENT] })
  mine(@CurrentUser() user: User) {
    return this.bookings.findMine(user.id);
  }

  @Post(':id/payment')
  @Access({ roles: [Role.CLIENT] })
  recordPayment(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() dto: RecordPaymentDto) {
    return this.bookings.recordPayment(user, id, dto);
  }

  @Post(':id/cancel')
  @Access({ roles: [Role.CLIENT] })
  cancel(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.bookings.cancel(user, id);
  }

  @Get('agent')
  @Access({ roles: [Role.AGENT], permission: Permission.VIEW_BOOKINGS })
  forAgent(@CurrentUser() user: User) {
    return this.bookings.findForAgent(user.id, hasPermission(user, Permission.VIEW_PAYMENTS));
  }

  @Get()
  @Access({ roles: [Role.MANAGER, Role.OWNER] })
  all(@CurrentUser() user: User) {
    if (user.role !== Role.OWNER && user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Your account is still awaiting approval.');
    }
    if (
      !hasPermission(user, Permission.VIEW_BOOKINGS) &&
      !hasPermission(user, Permission.APPROVE_BOOKINGS)
    ) {
      throw new ForbiddenException('Your manager has not granted you booking access.');
    }
    return this.bookings.findAll(hasPermission(user, Permission.VIEW_PAYMENTS));
  }

  @Patch(':id/approve')
  @Access({ roles: [Role.MANAGER, Role.OWNER], permission: Permission.APPROVE_BOOKINGS })
  approve(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() dto: ApproveBookingDto) {
    return this.bookings.approve(id, dto, hasPermission(user, Permission.VIEW_PAYMENTS));
  }

  @Patch(':id/refund')
  @Access({ roles: [Role.MANAGER, Role.OWNER], permission: Permission.VIEW_PAYMENTS })
  markRefundProcessed(@Param('id', ParseIntPipe) id: number) {
    return this.bookings.markRefundProcessed(id);
  }

}