import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_history')
export class SubscriptionHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  subscriptionId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  period!: 'monthly' | 'annual';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePriceEur!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  servicesPriceEur!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalBilledEur!: number;

  @Column({ type: 'timestamp' })
  startedAt!: Date;

  @Column({ type: 'timestamp' })
  endedAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
