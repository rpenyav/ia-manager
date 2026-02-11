import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ChatAuthService } from './chat-auth.service';

@Injectable()
export class ChatUserGuard implements CanActivate {
  constructor(private readonly chatAuthService: ChatAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-chat-token'];
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing chat token');
    }
    const payload = await this.chatAuthService.validateToken(token);
    if (request.auth?.tenantId && payload?.tenantId && request.auth.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Tenant mismatch');
    }
    request.chatUser = payload;
    return true;
  }
}
