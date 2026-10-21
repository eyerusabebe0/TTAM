import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tours') // This creates a table named 'tours' in your PostgreSQL database
export class Tour {
  @PrimaryGeneratedColumn()
  id!: number; // Auto-incrementing primary key ID

  @Column('varchar')
  title!: string;

  @Column('varchar')
  destination!: string;

  @Column('varchar')
  duration!: string;

  @Column('varchar')
  category!: string;

  @Column('int')
  price!: number;

  @Column('varchar', { nullable: true })
  image?: string;

  @Column('text')
  description!: string;

  @Column('varchar')
  date!: string;

  @Column('varchar', { default: '09:00' })
  startTime!: string;
}