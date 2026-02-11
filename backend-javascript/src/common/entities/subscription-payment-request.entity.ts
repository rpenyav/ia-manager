import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type SubscriptionPaymentStatus = 'pending' | 'completed' | 'expired';
export type SubscriptionPaymentProvider = 'stripe' | 'mock';

@Entity('subscription_payment_requests')
export class SubscriptionPaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 36 })
  subscriptionId!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: SubscriptionPaymentStatus;

  @Column({ type: 'varchar', length: 64 })
  provider!: SubscriptionPaymentProvider;

  @Column({ type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountEur!: number;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 120, nullable: true })
  providerRef!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
