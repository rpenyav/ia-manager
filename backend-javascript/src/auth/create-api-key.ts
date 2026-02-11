import 'reflect-metadata';
import { randomBytes, scryptSync } from 'crypto';
import dataSource from '../data-source';
import { ApiKey } from '../common/entities/api-key.entity';

function parseArg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

async function run() {
  const salt = process.env.API_KEY_SALT || '';
  if (salt.length < 16) {
    throw new Error('API_KEY_SALT must be at least 16 characters');
  }

  const name = parseArg('name') || 'backoffice';
  const tenantId = parseArg('tenantId');

  await dataSource.initialize();
  const repo = dataSource.getRepository(ApiKey);

  const plainKey = randomBytes(32).toString('hex');
  const hashedKey = scryptSync(plainKey, salt, 32).toString('hex');

  const apiKey = repo.create({
    name,
    tenantId: tenantId || null,
    hashedKey,
    status: 'active'
  });

  await repo.save(apiKey);
  await dataSource.destroy();

  console.log(plainKey);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
