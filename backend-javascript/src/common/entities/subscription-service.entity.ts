import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SubscriptionServiceStatus = 'active' | 'pending' | 'pending_removal';

@Entity('subscription_services')
export class SubscriptionService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  subscriptionId!: string;

  @Column({ type: 'varchar', length: 64 })
  serviceCode!: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: SubscriptionServiceStatus;

  @Column({ type: 'timestamp', nullable: true })
  activateAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivateAt!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceEur!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
