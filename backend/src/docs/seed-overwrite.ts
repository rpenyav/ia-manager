import 'reflect-metadata';
import dataSource from '../data-source';
import { DocumentationEntry } from '../common/entities/documentation-entry.entity';
import { DOCS_FULL } from './docs.full';

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(DocumentationEntry);

  await dataSource.query('TRUNCATE TABLE documentation_entries');

  for (const entry of DOCS_FULL) {
    await repo.save(
      repo.create({
        menuSlug: entry.menuSlug,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        link: entry.link,
        orderIndex: entry.orderIndex,
        enabled: true
      })
    );
  }

  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
