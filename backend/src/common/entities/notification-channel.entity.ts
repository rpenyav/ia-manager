import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_channels')
export class NotificationChannel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  type!: 'email' | 'slack';

  @Column({ type: 'json' })
  config!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  encryptedSecret!: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
