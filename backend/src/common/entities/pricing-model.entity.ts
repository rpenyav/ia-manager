import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('pricing_models')
export class PricingModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  providerType!: string;

  @Column({ type: 'varchar', length: 128 })
  model!: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  inputCostPer1k!: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  outputCostPer1k!: number;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
