import { CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('messages')
@Index('IDX_messages_thread', ['senderId', 'recipientId'])
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  senderId!: number;

  @Column({ type: 'int' })
  recipientId!: number;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
