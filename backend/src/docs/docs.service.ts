import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentationEntry } from '../common/entities/documentation-entry.entity';
import { CreateDocDto } from './dto/create-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(DocumentationEntry)
    private readonly docsRepository: Repository<DocumentationEntry>
  ) {}

  async list(params?: {
    menuSlug?: string;
    category?: string;
    enabled?: boolean;
    search?: string;
  }) {
    const qb = this.docsRepository.createQueryBuilder('doc');

    if (params?.menuSlug) {
      qb.andWhere('doc.menuSlug = :menuSlug', {
        menuSlug: this.normalizeSlug(params.menuSlug)
      });
    }
    if (params?.category) {
      qb.andWhere('doc.category = :category', {
        category: this.normalizeSlug(params.category)
      });
    }
    if (typeof params?.enabled === 'boolean') {
      qb.andWhere('doc.enabled = :enabled', { enabled: params.enabled });
    }
    if (params?.search) {
      qb.andWhere('(doc.title LIKE :q OR doc.content LIKE :q)', {
        q: `%${params.search}%`
      });
    }

    return qb
      .orderBy('doc.category', 'ASC')
      .addOrderBy('doc.orderIndex', 'ASC')
      .addOrderBy('doc.createdAt', 'ASC')
      .getMany();
  }

  async create(dto: CreateDocDto) {
    const entry = this.docsRepository.create({
      menuSlug: this.normalizeSlug(dto.menuSlug),
      category: this.normalizeCategory(dto.category),
      title: dto.title,
      content: dto.content,
      link: dto.link ?? null,
      orderIndex: dto.orderIndex ?? 0,
      enabled: dto.enabled ?? true
    });
    return this.docsRepository.save(entry);
  }

  async getById(id: string) {
    const entry = await this.docsRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Documentation entry not found');
    }
    return entry;
  }

  async update(id: string, dto: UpdateDocDto) {
    const entry = await this.docsRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Documentation entry not found');
    }

    Object.assign(entry, dto);
    if (dto.menuSlug) {
      entry.menuSlug = this.normalizeSlug(dto.menuSlug);
    }
    if (dto.category) {
      entry.category = this.normalizeCategory(dto.category);
    }

    return this.docsRepository.save(entry);
  }

  async remove(id: string) {
    const entry = await this.docsRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Documentation entry not found');
    }
    await this.docsRepository.remove(entry);
    return { id };
  }

  private normalizeSlug(value: string) {
    return value.trim().toLowerCase();
  }

  private normalizeCategory(value?: string) {
    if (!value) {
      return 'general';
    }
    return this.normalizeSlug(value);
  }
}
