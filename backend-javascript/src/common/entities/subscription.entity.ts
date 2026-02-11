import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SubscriptionPeriod = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'pending' | 'cancelled';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  tenantId!: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: SubscriptionStatus;

  @Column({ type: 'varchar', length: 16, default: 'monthly' })
  period!: SubscriptionPeriod;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePriceEur!: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'timestamp' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd!: Date;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
