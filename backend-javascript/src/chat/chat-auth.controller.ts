import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ChatAuthService } from './chat-auth.service';
import { LoginChatUserDto } from './dto/login-chat-user.dto';
import { RegisterChatUserDto } from './dto/register-chat-user.dto';

@Controller('chat/auth')
@UseGuards(AuthGuard, TenantGuard)
export class ChatAuthController {
  constructor(private readonly chatAuthService: ChatAuthService) {}

  @Post('register')
  register(@Req() request: Request & { tenantId: string }, @Body() dto: RegisterChatUserDto) {
    return this.chatAuthService.register(request.tenantId, dto);
  }

  @Post('login')
  login(@Req() request: Request & { tenantId: string }, @Body() dto: LoginChatUserDto) {
    return this.chatAuthService.login(request.tenantId, dto);
  }
}
