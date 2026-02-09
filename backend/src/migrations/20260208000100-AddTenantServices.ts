import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantServices20260208000100 implements MigrationInterface {
  name = 'AddTenantServices20260208000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_services (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        genericEnabled tinyint(1) NOT NULL DEFAULT 0,
        ocrEnabled tinyint(1) NOT NULL DEFAULT 0,
        sqlEnabled tinyint(1) NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tenant_services_tenant (tenantId)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS tenant_services');
  }
}
