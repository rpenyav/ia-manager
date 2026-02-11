import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TenantServiceStatus = 'active' | 'suspended';

@Entity('tenant_service_configs')
export class TenantServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  serviceCode!: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: TenantServiceStatus;

  @Column({ type: 'text', nullable: true })
  systemPrompt?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
