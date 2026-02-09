import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from '../common/entities/tenant-service.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantServicesController } from './tenant-services.controller';
import { TenantServicesService } from './tenant-services.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantService]), TenantsModule],
  controllers: [TenantServicesController],
  providers: [TenantServicesService],
  exports: [TenantServicesService]
})
export class TenantServicesModule {}
