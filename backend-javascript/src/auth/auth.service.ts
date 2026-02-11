import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  issueToken(clientId: string, clientSecret: string) {
    const adminClientId = process.env.AUTH_ADMIN_CLIENT_ID || '';
    const adminClientSecret = process.env.AUTH_ADMIN_CLIENT_SECRET || '';

    if (clientId !== adminClientId || clientSecret !== adminClientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const payload = { sub: clientId, role: 'admin' } as const;
    return this.issueAdminToken(payload.sub, payload.role);
  }

  issueAdminToken(username: string, role: 'admin' | 'editor') {
    return {
      accessToken: this.jwtService.sign({ sub: username, role }),
      expiresIn: Number(process.env.AUTH_JWT_TTL || 3600)
    };
  }

  issueTenantToken(tenantId: string, username: string) {
    return {
      accessToken: this.jwtService.sign({ sub: username, role: 'tenant', tenantId }),
      expiresIn: Number(process.env.AUTH_JWT_TTL || 3600)
    };
  }

  async validateJwt(token: string) {
    return this.jwtService.verifyAsync(token);
  }

  async validateApiKey(apiKey: string) {
    return this.apiKeysService.validate(apiKey);
  }
}
