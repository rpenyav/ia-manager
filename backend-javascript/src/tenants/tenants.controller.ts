import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSelfDto } from './dto/update-tenant-self.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';

@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  list(@Req() request: Request & { auth?: any }) {
    const tenantId = request.auth?.role === 'tenant' ? request.auth?.tenantId : undefined;
    return this.tenantsService.list(tenantId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch('me')
  updateSelf(@Req() request: Request & { auth?: any }, @Body() dto: UpdateTenantSelfDto) {
    const role = request.auth?.role;
    const tenantId = request.auth?.tenantId;
    if (role !== 'tenant' || !tenantId) {
      throw new BadRequestException('Tenant credentials required');
    }
    return this.tenantsService.updateSelf(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/kill-switch')
  @UseGuards(AdminRoleGuard)
  toggleKillSwitch(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.tenantsService.toggleKillSwitch(id, body.enabled);
  }
}
