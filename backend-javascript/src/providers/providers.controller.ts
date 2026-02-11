import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(AuthGuard, TenantGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  list(@Req() request: Request & { tenantId: string }) {
    return this.providersService.list(request.tenantId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Req() request: Request & { tenantId: string }, @Body() dto: CreateProviderDto) {
    return this.providersService.create(request.tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @Req() request: Request & { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto
  ) {
    return this.providersService.update(request.tenantId, id, dto);
  }
}
