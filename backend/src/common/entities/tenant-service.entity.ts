import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_services')
export class TenantService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  tenantId!: string;

  @Column({ type: 'boolean', default: false })
  genericEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  ocrEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  sqlEnabled!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
