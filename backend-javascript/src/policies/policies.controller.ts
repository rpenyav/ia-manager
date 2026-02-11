import { Body, Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';
import { PoliciesService } from './policies.service';

@Controller('policies')
@UseGuards(AuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @UseGuards(TenantGuard)
  get(@Req() request: Request & { tenantId: string }) {
    return this.policiesService.getByTenant(request.tenantId);
  }

  @Get('admin')
  @UseGuards(AdminRoleGuard)
  listAll() {
    return this.policiesService.listAll();
  }

  @Put()
  @UseGuards(TenantGuard, AdminRoleGuard)
  upsert(@Req() request: Request & { tenantId: string }, @Body() dto: UpsertPolicyDto) {
    return this.policiesService.upsert(request.tenantId, dto);
  }

  @Delete(':tenantId')
  @UseGuards(AdminRoleGuard)
  delete(@Param('tenantId') tenantId: string) {
    return this.policiesService.deleteByTenant(tenantId);
  }
}
