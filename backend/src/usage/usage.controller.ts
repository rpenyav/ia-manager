import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { UsageAlertsService } from './usage-alerts.service';
import { UsageService } from './usage.service';

@Controller('usage')
@UseGuards(AuthGuard)
export class UsageController {
  constructor(
    private readonly usageService: UsageService,
    private readonly alertsService: UsageAlertsService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Get('summary')
  async summary(@Req() request: Request, @Query('tenantId') tenantId?: string) {
    const resolved = (request as any).auth?.tenantId || tenantId;
    if (resolved) {
      return this.usageService.getSummaryByTenant(resolved);
    }
    return this.usageService.getSummaryAll();
  }

  @Get('alerts')
  async alerts(@Req() request: Request, @Query('tenantId') tenantId?: string) {
    const resolved = (request as any).auth?.tenantId || tenantId;
    return this.alertsService.list(resolved);
  }

  @Get('events')
  async events(@Req() request: Request, @Query('tenantId') tenantId?: string, @Query('limit') limit?: string) {
    const resolved = (request as any).auth?.tenantId || tenantId;
    const parsedLimit = Math.min(Math.max(Number(limit || 20), 1), 200);
    if (!resolved) {
      return this.usageService.listEventsAll(parsedLimit);
    }
    return this.usageService.listEvents(resolved, parsedLimit);
  }

  @Post('alerts/notify')
  async notify(@Req() request: Request, @Body() body: { tenantId?: string }) {
    const resolved = (request as any).auth?.tenantId || body?.tenantId;
    if (!resolved) {
      return { sent: 0 };
    }
    const alerts = await this.alertsService.list(resolved);
    return this.notificationsService.sendAlerts(resolved, alerts);
  }
}
