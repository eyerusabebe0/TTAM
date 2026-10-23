import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomCode } from '../common/random-code.js';
import { ToursService } from '../tours/tours.service.js';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { Booking, BookingStatus, PaymentStatus } from './booking.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ApproveBookingDto } from './dto/approve-booking.dto.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';

const COMMISSION_RATE = 0.10;
const UNPAID_BOOKING_HOLD_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private expiryTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @Inject(ToursService) private readonly tours: ToursService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(() => {
      void this.expireUnpaidBookings().catch((error: unknown) => {
        console.error('Could not expire unpaid bookings:', error);
      });
    }, 60_000);
    this.expiryTimer.unref();
    void this.expireUnpaidBookings().catch((error: unknown) => {
      console.error('Could not expire unpaid bookings:', error);
    });
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  async create(client: User, dto: CreateBookingDto) {
    const tour = await this.tours.findOne(dto.tourId); // 404 if it doesn't exist; price comes from OUR database
    const journeyTimestamp = new Date(`${tour.date}T00:00:00Z`).getTime();

    if (!tour.date || Number.isNaN(journeyTimestamp) || journeyTimestamp <= Date.now()) {
      throw new BadRequestException('This journey is no longer available to book.');
    }

    let agent: User | null = null;
    const code = (dto.agentCode || client.referralCode)?.trim();
    if (code) {
      agent = await this.users.findApprovedAgentByCode(code);
      if (!agent) throw new BadRequestException('That agent code was not recognised. Check it, or leave it empty.');
    }

    const total = tour.price * dto.partySize;
    const now = new Date();

    return this.repo.save(
      this.repo.create({
        reference: `TR-${randomCode(5)}`,
        clientId: client.id,
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        phone: client.phone ?? null,
        tourId: tour.id,
        tour: tour.title,
        place: tour.destination,
        price: total,
        pricePerPerson: tour.price,
        partySize: dto.partySize,
        journeyDate: tour.date,
        journeyStartTime: tour.startTime ?? null,
        journeyDuration: tour.duration ?? null,
        agentId: agent?.id ?? null,
        agentCode: agent?.code ?? null,
        agentName: agent?.name ?? 'Direct booking',
        commission: 0,
        expiresAt: new Date(now.getTime() + UNPAID_BOOKING_HOLD_MS),
      }),
    );
  }

  async findMine(clientId: number) {
    await this.expireUnpaidBookings();
    const bookings = await this.repo.find({ where: { clientId }, order: { id: 'DESC' } });
    const today = this.getEthiopianDate();
    return bookings.filter((booking) => (
      (!booking.journeyDate || booking.journeyDate >= today)
      && booking.status !== BookingStatus.EXPIRED
      && booking.paymentStatus !== PaymentStatus.EXPIRED
    ));
  }

  async findAll(showPayments: boolean) {
    await this.expireUnpaidBookings();
    return (await this.repo.find({ order: { id: 'DESC' } }))
      .filter((row) => !this.isPrivateUnpaidBooking(row))
      .map((row) => this.view(row, showPayments));
  }

  async findForAgent(agentId: number, showPayments: boolean) {
    await this.expireUnpaidBookings();
    return (await this.repo.find({ where: { agentId }, order: { id: 'DESC' } }))
      .filter((row) => !this.isPrivateUnpaidBooking(row))
      .map((row) => this.view(row, showPayments));
  }

  async approve(id: number, dto: ApproveBookingDto, showPayments: boolean) {
    await this.expireUnpaidBookings();
    const booking = await this.getOrFail(id);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
      throw new BadRequestException('Cancelled or expired bookings cannot be approved.');
    }
    if (booking.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('A booking must be paid before it can be approved.');
    }
    const tripCode = dto.tripCode.trim().toUpperCase();
    const existingCode = await this.repo.findOneBy({ tripCode });
    if (existingCode && existingCode.id !== id) {
      throw new BadRequestException('That trip code is already assigned to another booking.');
    }
    booking.status = BookingStatus.APPROVED;
    booking.approvedAt = new Date();
    booking.tripCode = tripCode;
    booking.journeyStartTime = dto.journeyStartTime;
    return this.view(await this.repo.save(booking), showPayments);
  }

  async recordPayment(client: User, id: number, dto: RecordPaymentDto) {
    const now = new Date();
    const booking = await this.getOrFail(id);
    if (booking.clientId !== client.id) throw new NotFoundException('Booking not found.');
    const result = await this.repo
      .createQueryBuilder()
      .update(Booking)
      .set({
        paymentMethod: dto.paymentMethod,
        amountBirr: dto.amountBirr,
        paymentReference: dto.paymentReference.trim(),
        paymentStatus: PaymentStatus.PAID,
        paidAt: now,
        commission: booking.agentId
          ? Math.round(dto.amountBirr * COMMISSION_RATE * 100) / 100
          : 0,
      })
      .where('id = :id AND "clientId" = :clientId AND "paymentStatus" = :awaiting', {
        id,
        clientId: client.id,
        awaiting: PaymentStatus.AWAITING,
      })
      .andWhere('("expiresAt" > :now OR "expiresAt" IS NULL)', { now })
      .execute();

    if (result.affected !== 1) {
      if (booking.paymentStatus === PaymentStatus.AWAITING && booking.expiresAt && booking.expiresAt <= now) {
        await this.expireBooking(id, now);
        throw new BadRequestException('The 24-hour payment window expired. Please book this journey again.');
      }
      throw new BadRequestException('This booking is no longer awaiting payment.');
    }
    return this.getOrFail(id);
  }

  async cancel(client: User, id: number) {
    const booking = await this.getOrFail(id);
    if (booking.clientId !== client.id) throw new NotFoundException('Booking not found.');
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
      throw new BadRequestException('This booking has already been cancelled.');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      if (!booking.journeyDate || Number.isNaN(new Date(`${booking.journeyDate}T00:00:00Z`).getTime())) {
        throw new BadRequestException('This booking does not have a valid journey date and cannot be cancelled online.');
      }
      if (!booking.amountBirr || booking.amountBirr <= 0) {
        throw new BadRequestException('This booking has no recorded Birr payment amount and cannot be refunded online.');
      }
      const daysUntilJourney = Math.ceil(
        (new Date(`${booking.journeyDate}T00:00:00Z`).getTime() - Date.now()) / DAY_MS,
      );
      if (daysUntilJourney < 1) {
        throw new BadRequestException('Bookings cannot be cancelled on or after the journey date.');
      }
      const refundRate = daysUntilJourney <= 5 ? 0.08 : daysUntilJourney <= 10 ? 0.04 : 0.02;
      booking.cancellationFee = Math.round(booking.amountBirr * refundRate * 100) / 100;
      booking.refundAmount = Math.round((booking.amountBirr - booking.cancellationFee) * 100) / 100;
      booking.agentCancellationShareBirr = 0;
      booking.commission = booking.agentId
        ? Math.round(booking.cancellationFee * COMMISSION_RATE * 100) / 100
        : 0;
      booking.paymentStatus = PaymentStatus.REFUND_DUE;
    } else {
      booking.cancellationFee = 0;
      booking.refundAmount = 0;
      booking.agentCancellationShareBirr = 0;
      booking.paymentStatus = PaymentStatus.CANCELLED;
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    return this.repo.save(booking);
  }

  async markRefundProcessed(id: number) {
    const booking = await this.getOrFail(id);
    if (booking.paymentStatus !== PaymentStatus.REFUND_DUE) {
      throw new BadRequestException('This booking has no refund waiting to be processed.');
    }
    booking.paymentStatus = PaymentStatus.REFUNDED;
    booking.refundProcessedAt = new Date();
    return this.repo.save(booking);
  }

  // Leads and net paid revenue are calculated, never stored.
  async agentStats(agentId: number) {
    const row = await this.repo
      .createQueryBuilder('b')
      .select('COUNT(*)', 'leads')
      .addSelect(
        `COALESCE(SUM(CASE WHEN b."paymentStatus" IN (:...recognizedPayments)
          THEN GREATEST(COALESCE(b."amountBirr", 0) - CASE WHEN b."paymentStatus" IN (:...refundPayments)
            THEN COALESCE(b."refundAmount", 0) ELSE 0 END, 0)
          ELSE 0 END), 0)`,
        'revenue',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN b."paymentStatus" IN (:...recognizedPayments) THEN b.commission ELSE 0 END), 0)',
        'commission',
      )
      .where('b.agentId = :agentId', { agentId })
      .setParameters({
        recognizedPayments: [PaymentStatus.PAID, PaymentStatus.REFUND_DUE, PaymentStatus.REFUNDED],
        refundPayments: [PaymentStatus.REFUND_DUE, PaymentStatus.REFUNDED],
      })
      .getRawOne<{ leads: string; revenue: string; commission: string }>();
    return {
      leads: Number(row?.leads ?? 0),
      revenue: Number(row?.revenue ?? 0),
      commission: Number(row?.commission ?? 0),
    };
  }

  private async getOrFail(id: number) {
    const booking = await this.repo.findOneBy({ id });
    if (!booking) throw new NotFoundException('Booking not found.');
    return booking;
  }

  private async expireUnpaidBookings() {
    const now = new Date();
    await this.repo
      .createQueryBuilder()
      .update(Booking)
      .set({ status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED, cancelledAt: now })
      .where('"paymentStatus" = :paymentStatus', { paymentStatus: PaymentStatus.AWAITING })
      .andWhere('"expiresAt" <= :now', { now })
      .execute();
  }

  private getEthiopianDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  private isPrivateUnpaidBooking(booking: Booking): boolean {
    return booking.paymentStatus === PaymentStatus.AWAITING
      || booking.paymentStatus === PaymentStatus.CANCELLED
      || booking.paymentStatus === PaymentStatus.EXPIRED
      || booking.status === BookingStatus.EXPIRED;
  }

  private async expireBooking(id: number, now: Date) {
    await this.repo
      .createQueryBuilder()
      .update(Booking)
      .set({ status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED, cancelledAt: now })
      .where('"id" = :id AND "paymentStatus" = :paymentStatus', { id, paymentStatus: PaymentStatus.AWAITING })
      .andWhere('"expiresAt" <= :now', { now })
      .execute();
  }

  // removes paymentStatus unless the viewer may see payments
  private view(booking: Booking, showPayments: boolean) {
    if (showPayments) return booking;
    const {
      paymentStatus: _paymentStatus,
      paymentMethod: _paymentMethod,
      paymentReference: _paymentReference,
      amountBirr: _amountBirr,
      cancellationFee: _cancellationFee,
      refundAmount: _refundAmount,
      ...rest
    } = booking;
    return rest;
  }
}