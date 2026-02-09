import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { ServiceCatalogService } from './service-catalog.service';

@Controller('services/catalog')
@UseGuards(AuthGuard)
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  list() {
    return this.serviceCatalogService.list();
  }
}
