import 'reflect-metadata';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  OWNER = 'owner',
  MANAGER = 'manager',
  AGENT = 'agent',
  CLIENT = 'client',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  name!: string;

  @Column('varchar', { unique: true })
  email!: string;

  // Added Phone Number field (Optional/Nullable in database)
  @Column('varchar', { nullable: true })
  phone?: string | null;

  // select: false ensures the password hash is excluded from general select queries
  @Column('varchar', { select: false })
  password!: string;

  @Column({ type: 'boolean', default: true })
  passwordSet!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
  role!: Role;

  // Clients & owner default to APPROVED; agents & managers default to PENDING
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.APPROVED })
  status!: UserStatus;

  // Permissions object (e.g. { registerAgents: true, viewBookings: false })
  @Column({ type: 'jsonb', default: () => "'{}'" })
  permissions!: Record<string, boolean>;

  // Invitation code (Optional, nullable, unique)
  @Column('varchar', { nullable: true, unique: true })
  code?: string | null;

  @Column('varchar', { nullable: true })
  referralCode?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}