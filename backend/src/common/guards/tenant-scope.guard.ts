import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.auth;
    if (auth?.role !== 'tenant') {
      return true;
    }
    const tenantId = auth?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant scope missing');
    }
    const paramTenantId = request.params?.tenantId;
    const queryTenantId = request.query?.tenantId;
    if (paramTenantId && tenantId && paramTenantId !== tenantId) {
      throw new ForbiddenException('Tenant scope violation');
    }
    if (queryTenantId && tenantId && queryTenantId !== tenantId) {
      throw new ForbiddenException('Tenant scope violation');
    }
    request.tenantId = tenantId;
    return true;
  }
}
