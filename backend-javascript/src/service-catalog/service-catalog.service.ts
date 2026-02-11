import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalog } from '../common/entities/service-catalog.entity';

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectRepository(ServiceCatalog)
    private readonly catalogRepository: Repository<ServiceCatalog>
  ) {}

  async list() {
    return this.catalogRepository.find({
      order: { name: 'ASC' }
    });
  }
}
