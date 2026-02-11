import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../common/entities/chat-conversation.entity';
import { ChatMessage } from '../common/entities/chat-message.entity';
import { ChatUser } from '../common/entities/chat-user.entity';
import { RuntimeService } from '../runtime/runtime.service';
import { TenantServicesService } from '../tenant-services/tenant-services.service';
import { ChatAuthService } from './chat-auth.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateChatUserDto } from './dto/create-chat-user.dto';
import { UpdateChatUserDto } from './dto/update-chat-user.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationsRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(ChatUser)
    private readonly usersRepository: Repository<ChatUser>,
    private readonly runtimeService: RuntimeService,
    private readonly chatAuthService: ChatAuthService,
    private readonly tenantServicesService: TenantServicesService
  ) {}

  async listConversations(tenantId: string, userId: string) {
    return this.conversationsRepository.find({
      where: { tenantId, userId },
      order: { updatedAt: 'DESC' }
    });
  }

  async listUserServices(tenantId: string, userId: string) {
    return this.tenantServicesService.listServicesForUser(tenantId, userId);
  }

  async createConversation(
    tenantId: string,
    userId: string,
    apiKeyId: string | null,
    dto: CreateConversationDto
  ) {
    const serviceCode = dto.serviceCode.trim();
    const access = await this.tenantServicesService.requireServiceAccess(tenantId, serviceCode, userId);
    const conversation = this.conversationsRepository.create({
      tenantId,
      userId,
      serviceCode,
      providerId: dto.providerId,
      model: dto.model,
      title: dto.title?.trim() || null,
      apiKeyId: apiKeyId || null
    });
    const saved = await this.conversationsRepository.save(conversation);
    const prompt = access.config?.systemPrompt?.trim() || dto.systemPrompt?.trim() || '';
    if (prompt) {
      const systemMessage = this.messagesRepository.create({
        tenantId,
        conversationId: saved.id,
        userId,
        role: 'system',
        content: prompt
      });
      await this.messagesRepository.save(systemMessage);
    }
    return saved;
  }

  async getConversation(tenantId: string, id: string) {
    const conversation = await this.conversationsRepository.findOne({ where: { id, tenantId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async listMessages(tenantId: string, conversationId: string) {
    return this.messagesRepository.find({
      where: { tenantId, conversationId },
      order: { createdAt: 'ASC' }
    });
  }

  async listMessagesForUser(tenantId: string, userId: string, conversationId: string) {
    const conversation = await this.getConversation(tenantId, conversationId);
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Conversation does not belong to user');
    }
    return this.listMessages(tenantId, conversationId);
  }

  async addMessage(
    tenantId: string,
    userId: string,
    apiKeyId: string | null,
    conversationId: string,
    dto: CreateMessageDto
  ) {
    const conversation = await this.getConversation(tenantId, conversationId);
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Conversation does not belong to user');
    }
    await this.tenantServicesService.requireServiceAccess(
      tenantId,
      conversation.serviceCode,
      userId
    );

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      throw new ForbiddenException('User disabled');
    }

    const userMessage = this.messagesRepository.create({
      tenantId,
      conversationId,
      userId,
      role: 'user',
      content: dto.content
    });
    await this.messagesRepository.save(userMessage);

    const history = await this.messagesRepository.find({
      where: { tenantId, conversationId },
      order: { createdAt: 'ASC' },
      take: 20
    });
    const payloadMessages = history.map((item) => ({
      role: item.role,
      content: item.content
    }));

    const runtimeResponse = await this.runtimeService.execute(tenantId, {
      providerId: conversation.providerId,
      model: conversation.model,
      payload: { messages: payloadMessages },
      serviceCode: conversation.serviceCode
    });

    const output = runtimeResponse.output as any;
    const assistantContent =
      output?.choices?.[0]?.message?.content ||
      output?.choices?.[0]?.text ||
      output?.response ||
      JSON.stringify(output);

    const usage = output?.usage || {};
    const tokensIn = Number(usage.prompt_tokens || usage.input_tokens || 0);
    const tokensOut = Number(usage.completion_tokens || usage.output_tokens || 0);

    const assistantMessage = this.messagesRepository.create({
      tenantId,
      conversationId,
      userId,
      role: 'assistant',
      content: assistantContent,
      tokensIn,
      tokensOut
    });
    await this.messagesRepository.save(assistantMessage);

    await this.conversationsRepository.update(
      { id: conversationId },
      { updatedAt: new Date(), apiKeyId: conversation.apiKeyId || apiKeyId || null }
    );

    return {
      conversationId,
      message: assistantMessage,
      output: runtimeResponse.output
    };
  }

  async adminListConversations(tenantId: string) {
    return this.conversationsRepository.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' }
    });
  }

  async adminListMessages(tenantId: string, conversationId: string) {
    const conversation = await this.getConversation(tenantId, conversationId);
    return this.messagesRepository.find({
      where: { tenantId, conversationId: conversation.id },
      order: { createdAt: 'ASC' }
    });
  }

  async adminDeleteConversation(tenantId: string, id: string) {
    const conversation = await this.getConversation(tenantId, id);
    await this.messagesRepository.delete({ conversationId: conversation.id, tenantId });
    return this.conversationsRepository.delete({ id: conversation.id, tenantId });
  }

  async adminListUsers(tenantId: string) {
    const users = await this.usersRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });
    return users.map((user) => ({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  }

  async adminCreateUser(tenantId: string, dto: CreateChatUserDto) {
    const existing = await this.usersRepository.findOne({
      where: { tenantId, email: dto.email.toLowerCase() }
    });
    if (existing) {
      throw new ForbiddenException('Email already registered');
    }
    const user = this.usersRepository.create({
      tenantId,
      email: dto.email.toLowerCase(),
      name: dto.name?.trim() || null,
      passwordHash: this.chatAuthService.hashPassword(dto.password)
    });
    const saved = await this.usersRepository.save(user);
    return {
      id: saved.id,
      tenantId: saved.tenantId,
      email: saved.email,
      name: saved.name,
      status: saved.status,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    };
  }

  async adminUpdateUser(tenantId: string, id: string, dto: UpdateChatUserDto) {
    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.email) {
      const normalized = dto.email.toLowerCase();
      const existing = await this.usersRepository.findOne({
        where: { tenantId, email: normalized }
      });
      if (existing && existing.id !== user.id) {
        throw new ForbiddenException('Email already registered');
      }
      user.email = normalized;
    }
    if (dto.name !== undefined) {
      user.name = dto.name?.trim() || null;
    }
    if (dto.password) {
      user.passwordHash = this.chatAuthService.hashPassword(dto.password);
    }
    if (dto.status) {
      user.status = dto.status;
    }
    const saved = await this.usersRepository.save(user);
    return {
      id: saved.id,
      tenantId: saved.tenantId,
      email: saved.email,
      name: saved.name,
      status: saved.status,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    };
  }

  async adminDeleteUser(tenantId: string, id: string) {
    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.tenantServicesService.removeUserFromAllServices(tenantId, id);
    await this.messagesRepository.delete({ tenantId, userId: id });
    await this.conversationsRepository.delete({ tenantId, userId: id });
    await this.usersRepository.delete({ tenantId, id });
    return { deleted: true };
  }
}
