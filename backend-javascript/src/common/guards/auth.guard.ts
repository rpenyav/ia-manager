import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { getCookieValue } from '../utils/cookies';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const apiKey = request.headers['x-api-key'];
    const cookieToken = getCookieValue(request.headers?.cookie, 'pm_auth_token');

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const payload = await this.authService.validateJwt(token);
        request.auth = { type: 'jwt', ...payload };
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }

    if (cookieToken) {
      try {
        const payload = await this.authService.validateJwt(cookieToken);
        request.auth = { type: 'jwt', ...payload };
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }

    if (apiKey && typeof apiKey === 'string') {
      const record = await this.authService.validateApiKey(apiKey);
      if (!record) {
        throw new UnauthorizedException('Invalid API key');
      }
      request.auth = { type: 'apiKey', tenantId: record.tenantId, apiKeyId: record.id };
      return true;
    }

    throw new UnauthorizedException('Missing credentials');
  }
}
