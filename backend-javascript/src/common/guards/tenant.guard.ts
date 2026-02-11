import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.auth?.tenantId || request.headers['x-tenant-id'];
    if (!tenantId || typeof tenantId !== 'string') {
      throw new BadRequestException('Missing X-Tenant-Id header');
    }
    request.tenantId = tenantId;
    return true;
  }
}
