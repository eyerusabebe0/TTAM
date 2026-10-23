import { describe, expect, it, vi } from 'vitest';
import { User } from '../users/user.entity.js';
import { Booking, BookingStatus, PaymentStatus } from './booking.entity.js';
import { BookingsService } from './bookings.service.js';

function setupBooking(daysUntilJourney: number, agentId: number | null = null) {
  const journey = new Date();
  journey.setUTCDate(journey.getUTCDate() + daysUntilJourney);
  journey.setUTCHours(0, 0, 0, 0);
  const booking = {
    id: 1,
    clientId: 7,
    reference: 'TR-TEST1',
    status: BookingStatus.APPROVED,
    paymentStatus: PaymentStatus.PAID,
    price: 1000,
    amountBirr: 10000,
    journeyDate: journey.toISOString().slice(0, 10),
    agentId,
    commission: agentId ? 100 : 0,
  } as Booking;
  const repo = {
    findOneBy: vi.fn().mockResolvedValue(booking),
    save: vi.fn(async (row: Booking) => row),
    createQueryBuilder: vi.fn(() => {
      const builder = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 0 }),
      };
      return builder;
    }),
  };
  const service = new BookingsService(
    repo as never,
    {} as never,
    {} as never,
  );
  return { booking, repo, service };
}

const client = { id: 7 } as User;

describe('BookingsService creation', () => {
  it('calculates the group total from the database tour price and snapshots agent attribution', async () => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 60);
    const tour = {
      id: 5,
      title: 'Highlands',
      destination: 'Lalibela',
      price: 1000,
      date: date.toISOString().slice(0, 10),
      duration: '5 days · Small group',
      startTime: '08:30',
    };
    const agent = { id: 12, name: 'Referral Agent', code: 'AGENT12' } as User;
    const repo = {
      create: vi.fn((booking: Partial<Booking>) => booking),
      save: vi.fn(async (booking: Partial<Booking>) => booking),
    };
    const service = new BookingsService(
      repo as never,
      { findOne: vi.fn().mockResolvedValue(tour) } as never,
      { findApprovedAgentByCode: vi.fn().mockResolvedValue(agent) } as never,
    );

    const created = await service.create(client, {
      tourId: tour.id,
      partySize: 3,
      name: 'Traveler',
      email: 'TRAVELER@example.com',
      agentCode: agent.code,
    });

    expect(created.pricePerPerson).toBe(1000);
    expect(created.price).toBe(3000);
    expect(created.partySize).toBe(3);
    expect(created.agentId).toBe(agent.id);
    expect(created.agentCode).toBe(agent.code);
    expect(created.commission).toBe(0);
    expect(created.journeyDuration).toBe(tour.duration);
    expect(created.journeyStartTime).toBe(tour.startTime);
    expect(created.expiresAt?.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    expect(created.expiresAt?.getTime()).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
  });
});

describe('BookingsService visibility and payment dates', () => {
  it('returns only the requesting agent’s referrals and hides payment data without permission', async () => {
    const repo = {
      createQueryBuilder: vi.fn(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue({ affected: 0 }),
        };
        return builder;
      }),
      find: vi.fn().mockResolvedValue([{
        id: 1,
        agentId: 12,
        agentCode: 'AGENT12',
        paymentStatus: PaymentStatus.PAID,
        amountBirr: 10000,
      }, {
        id: 2,
        agentId: 12,
        paymentStatus: PaymentStatus.AWAITING,
      }]),
    };
    const service = new BookingsService(repo as never, {} as never, {} as never);

    const rows = await service.findForAgent(12, false);

    expect(repo.find).toHaveBeenCalledWith({ where: { agentId: 12 }, order: { id: 'DESC' } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, agentId: 12, agentCode: 'AGENT12' });
    expect(rows[0]).not.toHaveProperty('paymentStatus');
    expect(rows[0]).not.toHaveProperty('amountBirr');
  });

  it('keeps unpaid booking holds private from managers and owners', async () => {
    const repo = {
      createQueryBuilder: vi.fn(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue({ affected: 0 }),
        };
        return builder;
      }),
      find: vi.fn().mockResolvedValue([
        { id: 1, paymentStatus: PaymentStatus.AWAITING },
        { id: 2, paymentStatus: PaymentStatus.PAID },
      ]),
    };
    const service = new BookingsService(repo as never, {} as never, {} as never);

    const rows = await service.findAll(false);

    expect(rows.map(({ id }) => id)).toEqual([2]);
  });

  it('hides completed journeys from the client booking dashboard', async () => {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const dateValues = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
    const yesterday = new Date(`${today}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const repo = {
      createQueryBuilder: vi.fn(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue({ affected: 0 }),
        };
        return builder;
      }),
      find: vi.fn().mockResolvedValue([
        { id: 1, clientId: client.id, journeyDate: yesterday.toISOString().slice(0, 10) },
        { id: 2, clientId: client.id, journeyDate: today },
      ]),
    };
    const service = new BookingsService(repo as never, {} as never, {} as never);

    const rows = await service.findMine(client.id);

    expect(rows.map(({ id }) => id)).toEqual([2]);
  });

  it('records the payment timestamp when a client payment is entered', async () => {
    const booking = { id: 1, clientId: client.id, agentId: 12, paymentStatus: PaymentStatus.AWAITING } as Booking;
    const builder = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const repo = {
      createQueryBuilder: vi.fn(() => builder),
      findOneBy: vi.fn().mockResolvedValue(booking),
    };
    const service = new BookingsService(repo as never, {} as never, {} as never);

    await service.recordPayment(client, booking.id, {
      paymentMethod: 'Telebirr',
      amountBirr: 10000,
      paymentReference: 'DEMO-123',
    });

    expect(builder.set).toHaveBeenCalledWith(expect.objectContaining({
      paymentStatus: PaymentStatus.PAID,
      paidAt: expect.any(Date),
      commission: 1000,
    }));
  });
});

describe('BookingsService cancellation', () => {
  it.each([
    [1, 800],
    [5, 800],
    [6, 400],
    [10, 400],
    [11, 200],
  ])('applies the correct cancellation fee with %i days remaining', async (days, fee) => {
    const { booking, service } = setupBooking(days);

    const cancelled = await service.cancel(client, booking.id);

    expect(cancelled.cancellationFee).toBe(fee);
    expect(cancelled.refundAmount).toBe(10000 - fee);
    expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    expect(cancelled.paymentStatus).toBe(PaymentStatus.REFUND_DUE);
  });

  it('recalculates agent commission to 10% of the retained cancellation fee', async () => {
    const { booking, service } = setupBooking(3, 12);

    const cancelled = await service.cancel(client, booking.id);

    expect(cancelled.cancellationFee).toBe(800);
    expect(cancelled.commission).toBe(80);
    expect(cancelled.agentCancellationShareBirr).toBe(0);
  });

  it('does not issue a payment refund when an unpaid booking is cancelled', async () => {
    const { booking, service } = setupBooking(3);
    booking.paymentStatus = PaymentStatus.AWAITING;

    const cancelled = await service.cancel(client, booking.id);

    expect(cancelled.cancellationFee).toBe(0);
    expect(cancelled.refundAmount).toBe(0);
    expect(cancelled.paymentStatus).toBe(PaymentStatus.CANCELLED);
  });

  it('expires an unpaid booking when a payment arrives after its 24-hour hold', async () => {
    const { booking, repo, service } = setupBooking(3);
    booking.paymentStatus = PaymentStatus.AWAITING;
    booking.expiresAt = new Date(Date.now() - 1);

    await expect(service.recordPayment(client, booking.id, {
      paymentMethod: 'Telebirr',
      amountBirr: 10000,
      paymentReference: 'DEMO-123',
    })).rejects.toThrow('The 24-hour payment window expired.');

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(2);
  });

  it('records a refund as processed only after it was marked due', async () => {
    const { booking, service } = setupBooking(3);
    booking.status = BookingStatus.CANCELLED;
    booking.paymentStatus = PaymentStatus.REFUND_DUE;
    booking.refundAmount = 9200;

    const updated = await service.markRefundProcessed(booking.id);

    expect(updated.paymentStatus).toBe(PaymentStatus.REFUNDED);
    expect(updated.refundProcessedAt).toBeInstanceOf(Date);
  });

  it('records when a manager approves the booking', async () => {
    const { booking, service } = setupBooking(3);
    booking.paymentStatus = PaymentStatus.PAID;

    const approved = await service.approve(booking.id, {
      tripCode: 'TRIP-1001',
      journeyStartTime: '08:30',
    }, false);

    expect(approved.status).toBe(BookingStatus.APPROVED);
    expect(approved.approvedAt).toBeInstanceOf(Date);
    expect(approved.tripCode).toBe('TRIP-1001');
    expect(approved.journeyStartTime).toBe('08:30');
  });

  it('does not allow an unpaid hold to be approved', async () => {
    const { booking, service } = setupBooking(3);
    booking.paymentStatus = PaymentStatus.AWAITING;

    await expect(service.approve(booking.id, {
      tripCode: 'TRIP-1002',
      journeyStartTime: '08:30',
    }, false)).rejects.toThrow('A booking must be paid before it can be approved.');
  });

  it('rejects a trip code already assigned to another booking', async () => {
    const { booking, repo, service } = setupBooking(3);
    repo.findOneBy.mockResolvedValueOnce(booking).mockResolvedValueOnce({
      id: 2,
      tripCode: 'TRIP-1001',
    } as Booking);

    await expect(service.approve(booking.id, {
      tripCode: 'TRIP-1001',
      journeyStartTime: '08:30',
    }, false)).rejects.toThrow('That trip code is already assigned to another booking.');
  });
});
