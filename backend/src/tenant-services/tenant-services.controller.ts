import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { UpdateTenantServicesDto } from './dto/update-tenant-services.dto';
import { TenantServicesService } from './tenant-services.service';

@Controller('tenants/:tenantId/services')
@UseGuards(AuthGuard, TenantScopeGuard)
export class TenantServicesController {
  constructor(private readonly tenantServicesService: TenantServicesService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.tenantServicesService.getByTenantId(tenantId);
  }

  @Put()
  upsert(@Param('tenantId') tenantId: string, @Body() dto: UpdateTenantServicesDto) {
    return this.tenantServicesService.upsert(tenantId, dto);
  }
}
