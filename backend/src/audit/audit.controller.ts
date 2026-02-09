import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AuditService } from './audit.service';
import { Request } from 'express';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Req() request: Request & { auth?: any },
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string
  ) {
    const parsed = Number(limit || 100);
    const resolvedTenantId =
      request.auth?.role === 'tenant' ? request.auth?.tenantId : tenantId;
    return this.auditService.list(
      Math.min(Math.max(parsed, 1), 500),
      resolvedTenantId
    );
  }
}
