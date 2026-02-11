import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChatService } from './chat.service';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';

@Controller('tenants/:tenantId/chat')
@UseGuards(AuthGuard, TenantScopeGuard, RolesGuard)
@Roles('admin', 'tenant')
export class ChatAdminController {
  constructor(private readonly chatService: ChatService) {}

  @Get('users')
  listUsers(@Req() request: Request & { auth?: any }, @Param('tenantId') tenantId: string) {
    return this.chatService.adminListUsers(tenantId);
  }

  @Post('users')
  createUser(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateChatUserDto
  ) {
    return this.chatService.adminCreateUser(tenantId, dto);
  }

  @Patch('users/:id')
  updateUser(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChatUserDto
  ) {
    return this.chatService.adminUpdateUser(tenantId, id, dto);
  }

  @Delete('users/:id')
  deleteUser(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string
  ) {
    return this.chatService.adminDeleteUser(tenantId, id);
  }

  @Get('conversations')
  listConversations(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string
  ) {
    return this.chatService.adminListConversations(tenantId);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string
  ) {
    return this.chatService.adminListMessages(tenantId, id);
  }

  @Delete('conversations/:id')
  deleteConversation(
    @Req() request: Request & { auth?: any },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string
  ) {
    return this.chatService.adminDeleteConversation(tenantId, id);
  }
}
