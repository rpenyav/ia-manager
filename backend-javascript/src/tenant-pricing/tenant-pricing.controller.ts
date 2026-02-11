import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { UpdateTenantPricingDto } from './dto/update-tenant-pricing.dto';
import { TenantPricingService } from './tenant-pricing.service';

@Controller('tenants/:tenantId/pricing')
@UseGuards(AuthGuard, TenantScopeGuard)
export class TenantPricingController {
  constructor(private readonly tenantPricingService: TenantPricingService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.tenantPricingService.getByTenantId(tenantId);
  }

  @Put()
  upsert(@Param('tenantId') tenantId: string, @Body() dto: UpdateTenantPricingDto) {
    return this.tenantPricingService.upsert(tenantId, dto);
  }
}
