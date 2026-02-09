import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard, AdminRoleGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('kill-switch')
  getKillSwitch() {
    return this.settingsService.getGlobalKillSwitch();
  }

  @Patch('kill-switch')
  setKillSwitch(@Body() body: { enabled: boolean }) {
    return this.settingsService.setGlobalKillSwitch(body.enabled);
  }

  @Get('alerts-schedule')
  getAlertsSchedule() {
    return this.settingsService.getAlertsSchedule();
  }

  @Patch('alerts-schedule')
  setAlertsSchedule(@Body() body: { cron: string; minIntervalMinutes: number }) {
    return this.settingsService.setAlertsSchedule(body);
  }

  @Get('debug-mode')
  getDebugMode() {
    return this.settingsService.getDebugMode();
  }

  @Patch('debug-mode')
  setDebugMode(@Body() body: { enabled: boolean }) {
    return this.settingsService.setDebugMode(body.enabled);
  }

  @Post('debug/purge')
  purge(@Body() body: { resources?: string[] }) {
    return this.settingsService.purgeResources(body?.resources);
  }
}
