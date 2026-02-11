import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('documentation_entries')
export class DocumentationEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  menuSlug!: string;

  @Column({ length: 64, default: 'general' })
  category!: string;

  @Column({ length: 160 })
  title!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link!: string | null;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
