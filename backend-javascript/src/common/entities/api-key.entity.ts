import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  hashedKey!: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'revoked';

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
