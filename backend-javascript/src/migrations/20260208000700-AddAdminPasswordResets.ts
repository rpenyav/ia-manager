import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminPasswordResets20260208000700 implements MigrationInterface {
  name = 'AddAdminPasswordResets20260208000700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_password_resets (
        id varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        tokenHash varchar(64) NOT NULL,
        expiresAt timestamp NOT NULL,
        usedAt timestamp NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS admin_password_resets');
  }
}
