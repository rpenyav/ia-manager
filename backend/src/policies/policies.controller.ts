import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';
import { PoliciesService } from './policies.service';

@Controller('policies')
@UseGuards(AuthGuard, TenantGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  get(@Req() request: Request & { tenantId: string }) {
    return this.policiesService.getByTenant(request.tenantId);
  }

  @Put()
  @UseGuards(AdminRoleGuard)
  upsert(@Req() request: Request & { tenantId: string }, @Body() dto: UpsertPolicyDto) {
    return this.policiesService.upsert(request.tenantId, dto);
  }
}
