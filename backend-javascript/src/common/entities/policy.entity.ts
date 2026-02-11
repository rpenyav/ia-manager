import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'int', default: 60 })
  maxRequestsPerMinute!: number;

  @Column({ type: 'int', default: 200000 })
  maxTokensPerDay!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  maxCostPerDayUsd!: number;

  @Column({ type: 'boolean', default: true })
  redactionEnabled!: boolean;

  @Column({ type: 'json' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
