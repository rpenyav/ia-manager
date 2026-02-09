import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionHistory20260209000200 implements MigrationInterface {
  name = 'AddSubscriptionHistory20260209000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        subscriptionId varchar(36) NULL,
        period varchar(16) NOT NULL,
        basePriceEur decimal(10,2) NOT NULL,
        servicesPriceEur decimal(10,2) NOT NULL,
        totalBilledEur decimal(10,2) NOT NULL,
        startedAt timestamp NOT NULL,
        endedAt timestamp NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS subscription_history');
  }
}
