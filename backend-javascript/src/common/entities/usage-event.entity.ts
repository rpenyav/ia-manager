import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usage_events')
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 36 })
  providerId!: string;

  @Column({ type: 'varchar', length: 64 })
  model!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  serviceCode?: string | null;

  @Column({ type: 'int' })
  tokensIn!: number;

  @Column({ type: 'int' })
  tokensOut!: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  costUsd!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
