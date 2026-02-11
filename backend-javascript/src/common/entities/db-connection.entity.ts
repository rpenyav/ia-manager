import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('db_connections')
export class DbConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: 'mysql' })
  engine!: string;

  @Column({ type: 'text' })
  encryptedConfig!: string;

  @Column({ type: 'json' })
  allowedTables!: string[];

  @Column({ type: 'boolean', default: true })
  readOnly!: boolean;

  @Column({ type: 'json' })
  metadata!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
