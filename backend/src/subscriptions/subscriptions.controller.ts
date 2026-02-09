import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('tenants/:tenantId/subscription')
@UseGuards(AuthGuard, TenantScopeGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getByTenantId(tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tenant')
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(tenantId, dto);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tenant')
  update(@Param('tenantId') tenantId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(tenantId, dto);
  }
}
