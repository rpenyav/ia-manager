import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPendingRemoval20260209001100 implements MigrationInterface {
  name = 'AddSubscriptionPendingRemoval20260209001100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscription_services
        ADD COLUMN deactivateAt timestamp NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscription_services
        DROP COLUMN deactivateAt
    `);
  }
}
