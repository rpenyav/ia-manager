import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { AdminPasswordReset } from '../common/entities/admin-password-reset.entity';
import { AdminUsersService } from './admin-users.service';

@Injectable()
export class AdminPasswordResetService {
  constructor(
    @InjectRepository(AdminPasswordReset)
    private readonly resetRepository: Repository<AdminPasswordReset>,
    private readonly adminUsersService: AdminUsersService
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async createReset(identifier: string, ttlMinutes = 30) {
    const user = await this.adminUsersService.findByIdentifier(identifier);
    if (!user || !user.email) {
      return null;
    }
    const token = randomBytes(32).toString('hex');
    const record = this.resetRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
    });
    await this.resetRepository.save(record);
    return { token, user };
  }

  async consumeReset(token: string) {
    const record = await this.resetRepository.findOne({
      where: { tokenHash: this.hashToken(token), usedAt: undefined }
    });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Invalid or expired token');
    }
    record.usedAt = new Date();
    await this.resetRepository.save(record);
    return record.userId;
  }
}
