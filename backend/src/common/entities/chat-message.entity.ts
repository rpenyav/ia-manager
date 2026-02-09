import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  conversationId!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 16 })
  role!: 'system' | 'user' | 'assistant';

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int', default: 0 })
  tokensIn!: number;

  @Column({ type: 'int', default: 0 })
  tokensOut!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
