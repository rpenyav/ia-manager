import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tenant_pricings')
export class TenantPricing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 36 })
  pricingId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
