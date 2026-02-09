import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  list() {
    return this.subscriptionsService.listAdminSummary();
  }

  @Post(':tenantId/approve')
  approve(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.approvePaymentByAdmin(tenantId);
  }
}
