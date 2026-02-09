import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentationEntry } from '../common/entities/documentation-entry.entity';
import { DOCS_DEFAULTS } from './docs.defaults';

@Injectable()
export class DocsSeedService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DocumentationEntry)
    private readonly docsRepository: Repository<DocumentationEntry>
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('DOCS_SEED_ON_STARTUP');
    if (enabled !== 'true') {
      return;
    }

    await this.run();
  }

  async run() {
    for (const entry of DOCS_DEFAULTS) {
      const existing = await this.docsRepository.findOne({
        where: { menuSlug: entry.menuSlug, title: entry.title }
      });

      if (existing) {
        continue;
      }

      await this.docsRepository.save(
        this.docsRepository.create({
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
  }
}
