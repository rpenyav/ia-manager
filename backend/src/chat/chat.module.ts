import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAuthController } from './chat-auth.controller';
import { ChatAdminController } from './chat-admin.controller';
import { ChatController } from './chat.controller';
import { ChatAuthService } from './chat-auth.service';
import { ChatService } from './chat.service';
import { ChatUserGuard } from './chat-user.guard';
import { ChatConversation } from '../common/entities/chat-conversation.entity';
import { ChatMessage } from '../common/entities/chat-message.entity';
import { ChatUser } from '../common/entities/chat-user.entity';
import { RuntimeModule } from '../runtime/runtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatUser, ChatConversation, ChatMessage]),
    RuntimeModule,
    JwtModule.register({
      secret: process.env.CHAT_JWT_SECRET || process.env.AUTH_JWT_SECRET || 'replace_me',
      signOptions: { expiresIn: Number(process.env.CHAT_JWT_TTL || 7200) }
    })
  ],
  controllers: [ChatAuthController, ChatController, ChatAdminController],
  providers: [ChatAuthService, ChatService, ChatUserGuard],
  exports: [ChatAuthService, ChatService]
})
export class ChatModule {}
