import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptions20260209000100 implements MigrationInterface {
  name = 'AddSubscriptions20260209000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_catalog (
        id varchar(36) NOT NULL,
        code varchar(64) NOT NULL,
        name varchar(120) NOT NULL,
        description text NOT NULL,
        priceMonthlyEur decimal(10,2) NOT NULL,
        priceAnnualEur decimal(10,2) NOT NULL,
        enabled tinyint(1) NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_service_catalog_code (code)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        period varchar(16) NOT NULL DEFAULT 'monthly',
        basePriceEur decimal(10,2) NOT NULL DEFAULT 0,
        currency varchar(3) NOT NULL DEFAULT 'EUR',
        currentPeriodStart timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        currentPeriodEnd timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cancelAtPeriodEnd tinyint(1) NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_subscription_tenant (tenantId)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscription_services (
        id varchar(36) NOT NULL,
        subscriptionId varchar(36) NOT NULL,
        serviceCode varchar(64) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        activateAt timestamp NULL,
        priceEur decimal(10,2) NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_subscription_service (subscriptionId, serviceCode)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      INSERT IGNORE INTO service_catalog
        (id, code, name, description, priceMonthlyEur, priceAnnualEur, enabled)
      VALUES
        (UUID(), 'chat_generic', 'Chatbot genérico', 'Servicio conversacional general para FAQ y soporte.', 49.00, 499.00, 1),
        (UUID(), 'chat_ocr', 'Chatbot OCR', 'Servicio con OCR y consulta sobre documentos.', 79.00, 799.00, 1),
        (UUID(), 'chat_sql', 'Chatbot SQL', 'Servicio para consultas sobre bases de datos.', 99.00, 999.00, 1);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS subscription_services');
    await queryRunner.query('DROP TABLE IF EXISTS subscriptions');
    await queryRunner.query('DROP TABLE IF EXISTS service_catalog');
  }
}
