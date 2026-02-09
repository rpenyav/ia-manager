import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Request } from 'express';

@Controller('auth/api-keys')
@UseGuards(AuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(dto.name, dto.tenantId);
  }

  @Get()
  list(@Req() request: Request & { auth?: any }) {
    const tenantId = request.auth?.role === 'tenant' ? request.auth?.tenantId : undefined;
    return this.apiKeysService.list(tenantId);
  }

  @Patch(':id/revoke')
  @UseGuards(AdminRoleGuard)
  revoke(@Param('id') id: string) {
    return this.apiKeysService.revoke(id);
  }

  @Patch(':id/rotate')
  @UseGuards(AdminRoleGuard)
  rotate(@Param('id') id: string) {
    return this.apiKeysService.rotate(id);
  }
}
