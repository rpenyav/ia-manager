import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: 'active' | 'suspended' | 'disabled';

  @Column({ type: 'boolean', default: false })
  killSwitch!: boolean;

  @Column({ type: 'varchar', length: 180, nullable: true })
  billingEmail!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  contactName!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  addressLine1!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  billingAddressLine1!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  billingAddressLine2!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  billingCity!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingPostalCode!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  billingCountry!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  taxId!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true, unique: true })
  authUsername!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authPasswordHash!: string | null;

  @Column({ type: 'boolean', default: false })
  authMustChangePassword!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
