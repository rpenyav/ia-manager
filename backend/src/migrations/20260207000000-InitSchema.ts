import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema20260207000000 implements MigrationInterface {
  name = 'InitSchema20260207000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id varchar(36) NOT NULL,
        name varchar(120) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'active',
        killSwitch tinyint(1) NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        type varchar(64) NOT NULL,
        displayName varchar(255) NOT NULL,
        encryptedCredentials text NOT NULL,
        config json NOT NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        maxRequestsPerMinute int NOT NULL DEFAULT 60,
        maxTokensPerDay int NOT NULL DEFAULT 200000,
        maxCostPerDayUsd decimal(10,4) NOT NULL DEFAULT 0,
        redactionEnabled tinyint(1) NOT NULL DEFAULT 1,
        metadata json NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        model varchar(64) NOT NULL,
        tokensIn int NOT NULL,
        tokensOut int NOT NULL,
        costUsd decimal(10,6) NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        action varchar(64) NOT NULL,
        status varchar(32) NOT NULL,
        metadata json NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NULL,
        name varchar(120) NOT NULL,
        hashedKey varchar(255) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        ` + '`key`' + ` varchar(64) NOT NULL,
        value json NOT NULL,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (` + '`key`' + `)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pricing_models (
        id varchar(36) NOT NULL,
        providerType varchar(64) NOT NULL,
        model varchar(128) NOT NULL,
        inputCostPer1k decimal(10,6) NOT NULL,
        outputCostPer1k decimal(10,6) NOT NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NULL,
        url varchar(255) NOT NULL,
        events json NOT NULL,
        encryptedSecret text NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_channels (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NULL,
        type varchar(16) NOT NULL,
        config json NOT NULL,
        encryptedSecret text NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS notification_channels');
    await queryRunner.query('DROP TABLE IF EXISTS webhooks');
    await queryRunner.query('DROP TABLE IF EXISTS pricing_models');
    await queryRunner.query('DROP TABLE IF EXISTS system_settings');
    await queryRunner.query('DROP TABLE IF EXISTS api_keys');
    await queryRunner.query('DROP TABLE IF EXISTS audit_events');
    await queryRunner.query('DROP TABLE IF EXISTS usage_events');
    await queryRunner.query('DROP TABLE IF EXISTS policies');
    await queryRunner.query('DROP TABLE IF EXISTS providers');
    await queryRunner.query('DROP TABLE IF EXISTS tenants');
  }
}
