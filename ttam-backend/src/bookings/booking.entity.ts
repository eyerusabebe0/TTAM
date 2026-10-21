import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum BookingStatus {
  NEW = 'New request',
  APPROVED = 'Approved',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
}

export enum PaymentStatus {
  AWAITING = 'Awaiting payment',
  PAID = 'Paid',
  REFUND_DUE = 'Refund due',
  REFUNDED = 'Refunded',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  reference!: string;

  @Column({ type: 'int' })
  clientId!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  // A snapshot of the tour at booking time. If the tour is edited later, this booking keeps its original price.
  @Column({ type: 'int' })
  tourId!: number;

  @Column({ type: 'varchar' })
  tour!: string;

  @Column({ type: 'varchar' })
  place!: string;

  @Column({ type: 'int' })
  price!: number;

  @Column({ type: 'int', default: 0 })
  pricePerPerson!: number;

  @Column({ type: 'int', default: 1 })
  partySize!: number;

  @Column({ type: 'varchar', nullable: true })
  journeyDate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  journeyStartTime!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  tripCode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  journeyDuration!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  agentId!: number | null;

  @Column({ type: 'varchar', nullable: true })
  agentCode!: string | null;

  @Column({ type: 'varchar', default: 'Direct booking' })
  agentName!: string;

  // numeric comes back from Postgres as a string, so the transformer converts it to a number
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  commission!: number;

  @Column({ type: 'varchar', default: BookingStatus.NEW })
  status!: string;

  @Column({ type: 'varchar', default: PaymentStatus.AWAITING })
  paymentStatus!: string;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod!: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentReference!: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) },
  })
  amountBirr!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  cancellationFee!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  refundAmount!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => Number(value) },
  })
  agentCancellationShareBirr!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  refundProcessedAt!: Date | null;
}