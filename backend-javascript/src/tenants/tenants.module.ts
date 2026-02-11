import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { Tenant } from '../common/entities/tenant.entity';
import { TenantAuthService } from '../auth/tenant-auth.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), CommonModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantAuthService],
  exports: [TenantsService, TenantAuthService]
})
export class TenantsModule {}
