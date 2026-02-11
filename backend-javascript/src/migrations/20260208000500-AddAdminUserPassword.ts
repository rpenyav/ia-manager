import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminUserPassword20260208000500 implements MigrationInterface {
  name = 'AddAdminUserPassword20260208000500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admin_users
      ADD COLUMN passwordHash varchar(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE admin_users
      DROP COLUMN passwordHash;
    `);
  }
}
