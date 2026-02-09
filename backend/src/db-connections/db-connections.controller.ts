import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateDbConnectionDto } from './dto/create-db-connection.dto';
import { UpdateDbConnectionDto } from './dto/update-db-connection.dto';
import { DbConnectionsService } from './db-connections.service';

@Controller('db-connections')
@UseGuards(AuthGuard, TenantGuard)
export class DbConnectionsController {
  constructor(private readonly dbConnectionsService: DbConnectionsService) {}

  @Get()
  list(@Req() request: Request & { tenantId: string }) {
    return this.dbConnectionsService.list(request.tenantId);
  }

  @Post()
  create(@Req() request: Request & { tenantId: string }, @Body() dto: CreateDbConnectionDto) {
    return this.dbConnectionsService.create(request.tenantId, dto);
  }

  @Patch(':id')
  update(
    @Req() request: Request & { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdateDbConnectionDto
  ) {
    return this.dbConnectionsService.update(request.tenantId, id, dto);
  }
}
