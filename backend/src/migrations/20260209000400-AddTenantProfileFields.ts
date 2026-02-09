import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantProfileFields20260209000400 implements MigrationInterface {
  name = 'AddTenantProfileFields20260209000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN companyName varchar(180) NULL,
        ADD COLUMN contactName varchar(180) NULL,
        ADD COLUMN phone varchar(40) NULL,
        ADD COLUMN addressLine1 varchar(180) NULL,
        ADD COLUMN addressLine2 varchar(180) NULL,
        ADD COLUMN city varchar(120) NULL,
        ADD COLUMN postalCode varchar(20) NULL,
        ADD COLUMN country varchar(80) NULL,
        ADD COLUMN billingAddressLine1 varchar(180) NULL,
        ADD COLUMN billingAddressLine2 varchar(180) NULL,
        ADD COLUMN billingCity varchar(120) NULL,
        ADD COLUMN billingPostalCode varchar(20) NULL,
        ADD COLUMN billingCountry varchar(80) NULL,
        ADD COLUMN taxId varchar(40) NULL,
        ADD COLUMN website varchar(180) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN companyName,
        DROP COLUMN contactName,
        DROP COLUMN phone,
        DROP COLUMN addressLine1,
        DROP COLUMN addressLine2,
        DROP COLUMN city,
        DROP COLUMN postalCode,
        DROP COLUMN country,
        DROP COLUMN billingAddressLine1,
        DROP COLUMN billingAddressLine2,
        DROP COLUMN billingCity,
        DROP COLUMN billingPostalCode,
        DROP COLUMN billingCountry,
        DROP COLUMN taxId,
        DROP COLUMN website;
    `);
  }
}
