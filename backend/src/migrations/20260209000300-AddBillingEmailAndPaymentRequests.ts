import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingEmailAndPaymentRequests20260209000300 implements MigrationInterface {
  name = 'AddBillingEmailAndPaymentRequests20260209000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN billingEmail varchar(180) NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscription_payment_requests (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        subscriptionId varchar(36) NOT NULL,
        email varchar(180) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'pending',
        provider varchar(16) NOT NULL,
        tokenHash varchar(128) NOT NULL,
        amountEur decimal(10,2) NOT NULL,
        expiresAt timestamp NOT NULL,
        providerRef varchar(120) NULL,
        completedAt timestamp NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_payment_token (tokenHash)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS subscription_payment_requests');
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN billingEmail');
  }
}
