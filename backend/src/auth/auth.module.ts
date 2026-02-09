import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../common/entities/api-key.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AdminPasswordReset } from '../common/entities/admin-password-reset.entity';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminPasswordResetService } from './admin-password-reset.service';
import { EmailService } from '../common/services/email.service';
import { TenantsModule } from '../tenants/tenants.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, AdminUser, AdminPasswordReset]),
    TenantsModule,
    JwtModule.register({
      secret: process.env.AUTH_JWT_SECRET || 'replace_me',
      signOptions: { expiresIn: Number(process.env.AUTH_JWT_TTL || 3600) }
    })
  ],
  controllers: [AuthController, ApiKeysController, AdminUsersController],
  providers: [
    AuthService,
    ApiKeysService,
    AdminUsersService,
    AdminPasswordResetService,
    EmailService,
    AuthGuard,
    AdminRoleGuard,
    RolesGuard,
    TenantScopeGuard
  ],
  exports: [
    AuthService,
    ApiKeysService,
    AdminUsersService,
    AdminPasswordResetService,
    EmailService,
    JwtModule,
    AuthGuard,
    AdminRoleGuard,
    RolesGuard,
    TenantScopeGuard
  ]
})
export class AuthModule {}
