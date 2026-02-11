import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantPricings20260208000200 implements MigrationInterface {
  name = 'AddTenantPricings20260208000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_pricings (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        pricingId varchar(36) NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tenant_pricing (tenantId, pricingId)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS tenant_pricings');
  }
}
