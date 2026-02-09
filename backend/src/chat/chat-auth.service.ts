import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { ChatUser } from '../common/entities/chat-user.entity';
import { RegisterChatUserDto } from './dto/register-chat-user.dto';
import { LoginChatUserDto } from './dto/login-chat-user.dto';

@Injectable()
export class ChatAuthService {
  private readonly salt: string;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(ChatUser)
    private readonly chatUsersRepository: Repository<ChatUser>
  ) {
    const salt = process.env.CHAT_PASSWORD_SALT || '';
    if (salt.length < 16) {
      throw new Error('CHAT_PASSWORD_SALT must be at least 16 characters');
    }
    this.salt = salt;
  }

  private hash(value: string) {
    return scryptSync(value, this.salt, 32).toString('hex');
  }

  private compare(value: string, hash: string) {
    const computed = this.hash(value);
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  }

  hashPassword(value: string) {
    return this.hash(value);
  }

  async register(tenantId: string, dto: RegisterChatUserDto) {
    const existing = await this.chatUsersRepository.findOne({
      where: { tenantId, email: dto.email.toLowerCase() }
    });
    if (existing) {
      throw new ForbiddenException('Email already registered');
    }

    const user = this.chatUsersRepository.create({
      tenantId,
      email: dto.email.toLowerCase(),
      name: dto.name?.trim() || null,
      passwordHash: this.hash(dto.password)
    });
    await this.chatUsersRepository.save(user);

    return this.issueToken(user);
  }

  async login(tenantId: string, dto: LoginChatUserDto) {
    const user = await this.chatUsersRepository.findOne({
      where: { tenantId, email: dto.email.toLowerCase() }
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.compare(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueToken(user);
  }

  async issueToken(user: ChatUser) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        status: user.status
      }
    };
  }

  async validateToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid chat token');
    }
  }

  async getUserById(id: string) {
    return this.chatUsersRepository.findOne({ where: { id } });
  }
}
