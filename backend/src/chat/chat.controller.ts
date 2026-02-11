import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { ChatUserGuard } from './chat-user.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(AuthGuard, ChatUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private getTenantId(request: Request & { auth?: any; chatUser?: any }) {
    const tenantId = request.auth?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant');
    }
    if (request.chatUser?.tenantId && request.chatUser.tenantId !== tenantId) {
      throw new UnauthorizedException('Tenant mismatch');
    }
    return tenantId;
  }

  private getUserId(request: Request & { chatUser?: any }) {
    const userId = request.chatUser?.sub || request.chatUser?.id;
    if (!userId) {
      throw new UnauthorizedException('Missing chat user');
    }
    return userId;
  }

  @Get('conversations')
  listConversations(@Req() request: Request & { auth?: any; chatUser?: any }) {
    const tenantId = this.getTenantId(request);
    const userId = this.getUserId(request);
    return this.chatService.listConversations(tenantId, userId);
  }

  @Get('services')
  listServices(@Req() request: Request & { auth?: any; chatUser?: any }) {
    const tenantId = this.getTenantId(request);
    const userId = this.getUserId(request);
    return this.chatService.listUserServices(tenantId, userId);
  }

  @Post('conversations')
  createConversation(
    @Req() request: Request & { auth?: any; chatUser?: any },
    @Body() dto: CreateConversationDto
  ) {
    const tenantId = this.getTenantId(request);
    const userId = this.getUserId(request);
    const apiKeyId = request.auth?.apiKeyId || null;
    return this.chatService.createConversation(tenantId, userId, apiKeyId, dto);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Req() request: Request & { auth?: any; chatUser?: any },
    @Param('id') id: string
  ) {
    const tenantId = this.getTenantId(request);
    const userId = this.getUserId(request);
    return this.chatService.listMessagesForUser(tenantId, userId, id);
  }

  @Post('conversations/:id/messages')
  addMessage(
    @Req() request: Request & { auth?: any; chatUser?: any },
    @Param('id') id: string,
    @Body() dto: CreateMessageDto
  ) {
    const tenantId = this.getTenantId(request);
    const userId = this.getUserId(request);
    const apiKeyId = request.auth?.apiKeyId || null;
    return this.chatService.addMessage(tenantId, userId, apiKeyId, id, dto);
  }
}
