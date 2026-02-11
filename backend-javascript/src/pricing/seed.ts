import 'reflect-metadata';
import dataSource from '../data-source';
import { PricingModel } from '../common/entities/pricing-model.entity';
import { pricingDefaults } from './pricing.defaults';

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(PricingModel);

  for (const item of pricingDefaults) {
    const existing = await repo.findOne({
      where: {
        providerType: item.providerType,
        model: item.model
      }
    });

    if (existing) {
      existing.inputCostPer1k = item.inputCostPer1k;
      existing.outputCostPer1k = item.outputCostPer1k;
      existing.enabled = true;
      await repo.save(existing);
      continue;
    }

    const created = repo.create({
      providerType: item.providerType,
      model: item.model,
      inputCostPer1k: item.inputCostPer1k,
      outputCostPer1k: item.outputCostPer1k,
      enabled: true
    });
    await repo.save(created);
  }

  await dataSource.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
