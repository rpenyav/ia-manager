import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminUsers20260208000400 implements MigrationInterface {
  name = 'AddAdminUsers20260208000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id varchar(36) NOT NULL,
        username varchar(120) NOT NULL,
        name varchar(120) NULL,
        email varchar(160) NULL,
        role varchar(32) NOT NULL DEFAULT 'admin',
        status varchar(16) NOT NULL DEFAULT 'active',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_users_username (username)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS admin_users');
  }
}
