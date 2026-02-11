import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantServiceAccess20260210001000 implements MigrationInterface {
  name = 'AddTenantServiceAccess20260210001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_service_configs (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        serviceCode varchar(64) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        systemPrompt text NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tenant_service_config (tenantId, serviceCode)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_service_endpoints (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        serviceCode varchar(64) NOT NULL,
        slug varchar(64) NOT NULL,
        method varchar(12) NOT NULL,
        path varchar(255) NOT NULL,
        baseUrl varchar(255) NULL,
        headers json NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tenant_service_endpoint (tenantId, serviceCode, slug)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_service_users (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        serviceCode varchar(64) NOT NULL,
        userId varchar(36) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_tenant_service_user (tenantId, serviceCode, userId)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      ALTER TABLE chat_conversations
      ADD COLUMN serviceCode varchar(64) NOT NULL DEFAULT 'chat_generic'
    `);

    await queryRunner.query(`
      ALTER TABLE usage_events
      ADD COLUMN serviceCode varchar(64) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE usage_events DROP COLUMN serviceCode`);
    await queryRunner.query(`ALTER TABLE chat_conversations DROP COLUMN serviceCode`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_service_users`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_service_endpoints`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_service_configs`);
  }
}
