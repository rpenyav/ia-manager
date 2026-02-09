import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminUserMustChange20260208000600 implements MigrationInterface {
  name = 'AddAdminUserMustChange20260208000600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admin_users
      ADD COLUMN mustChangePassword tinyint(1) NOT NULL DEFAULT 1;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admin_users
      DROP COLUMN mustChangePassword;
    `);
  }
}
