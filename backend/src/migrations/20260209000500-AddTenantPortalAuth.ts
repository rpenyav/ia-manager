import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantPortalAuth20260209000500 implements MigrationInterface {
  name = 'AddTenantPortalAuth20260209000500';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN authUsername varchar(120) NULL,
        ADD COLUMN authPasswordHash varchar(255) NULL,
        ADD COLUMN authMustChangePassword tinyint(1) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_tenants_auth_username ON tenants (authUsername)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_tenants_auth_username ON tenants`);
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN authUsername,
        DROP COLUMN authPasswordHash,
        DROP COLUMN authMustChangePassword
    `);
  }
}
