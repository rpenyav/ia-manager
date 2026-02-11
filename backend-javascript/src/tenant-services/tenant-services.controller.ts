import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { AssignTenantServiceUserDto } from './dto/assign-tenant-service-user.dto';
import { CreateTenantServiceEndpointDto } from './dto/create-tenant-service-endpoint.dto';
import { UpdateTenantServiceConfigDto } from './dto/update-tenant-service-config.dto';
import { UpdateTenantServiceEndpointDto } from './dto/update-tenant-service-endpoint.dto';
import { UpdateTenantServiceUserDto } from './dto/update-tenant-service-user.dto';
import { TenantServicesService } from './tenant-services.service';

@Controller('tenants/:tenantId/services')
@UseGuards(AuthGuard, TenantScopeGuard, RolesGuard)
@Roles('admin', 'tenant')
export class TenantServicesController {
  constructor(private readonly tenantServicesService: TenantServicesService) {}

  @Get()
  list(@Param('tenantId') tenantId: string) {
    return this.tenantServicesService.listServices(tenantId);
  }

  @Patch(':serviceCode/config')
  updateConfig(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Body() dto: UpdateTenantServiceConfigDto
  ) {
    return this.tenantServicesService.updateConfig(
      tenantId,
      serviceCode,
      dto.status,
      dto.systemPrompt
    );
  }

  @Get(':serviceCode/endpoints')
  listEndpoints(@Param('tenantId') tenantId: string, @Param('serviceCode') serviceCode: string) {
    return this.tenantServicesService.listEndpoints(tenantId, serviceCode);
  }

  @Post(':serviceCode/endpoints')
  createEndpoint(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Body() dto: CreateTenantServiceEndpointDto
  ) {
    return this.tenantServicesService.createEndpoint(tenantId, serviceCode, dto);
  }

  @Patch(':serviceCode/endpoints/:id')
  updateEndpoint(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Param('id') id: string,
    @Body() dto: UpdateTenantServiceEndpointDto
  ) {
    return this.tenantServicesService.updateEndpoint(tenantId, serviceCode, id, dto);
  }

  @Delete(':serviceCode/endpoints/:id')
  deleteEndpoint(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Param('id') id: string
  ) {
    return this.tenantServicesService.deleteEndpoint(tenantId, serviceCode, id);
  }

  @Get(':serviceCode/users')
  listUsers(@Param('tenantId') tenantId: string, @Param('serviceCode') serviceCode: string) {
    return this.tenantServicesService.listServiceUsers(tenantId, serviceCode);
  }

  @Post(':serviceCode/users')
  assignUser(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Body() dto: AssignTenantServiceUserDto
  ) {
    return this.tenantServicesService.assignUser(tenantId, serviceCode, dto.userId, dto.status);
  }

  @Patch(':serviceCode/users/:userId')
  updateUser(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantServiceUserDto
  ) {
    return this.tenantServicesService.updateServiceUser(tenantId, serviceCode, userId, dto.status);
  }

  @Delete(':serviceCode/users/:userId')
  removeUser(
    @Param('tenantId') tenantId: string,
    @Param('serviceCode') serviceCode: string,
    @Param('userId') userId: string
  ) {
    return this.tenantServicesService.removeServiceUser(tenantId, serviceCode, userId);
  }
}
