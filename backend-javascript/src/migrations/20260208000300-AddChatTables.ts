import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatTables20260208000300 implements MigrationInterface {
  name = 'AddChatTables20260208000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_users (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        email varchar(160) NOT NULL,
        name varchar(120) NULL,
        passwordHash varchar(255) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        model varchar(128) NOT NULL,
        title varchar(200) NULL,
        apiKeyId varchar(36) NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id varchar(36) NOT NULL,
        conversationId varchar(36) NOT NULL,
        tenantId varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        role varchar(16) NOT NULL,
        content text NOT NULL,
        tokensIn int NOT NULL DEFAULT 0,
        tokensOut int NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS chat_messages');
    await queryRunner.query('DROP TABLE IF EXISTS chat_conversations');
    await queryRunner.query('DROP TABLE IF EXISTS chat_users');
  }
}
