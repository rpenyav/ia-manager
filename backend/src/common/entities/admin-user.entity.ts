import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  name?: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string | null;

  @Column({ type: 'boolean', default: true })
  mustChangePassword!: boolean;

  @Column({ type: 'varchar', length: 32, default: 'admin' })
  role!: 'admin' | 'editor';

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'disabled';

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
