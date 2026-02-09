import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { AdminUser } from '../common/entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AdminUsersService {
  private readonly salt: string;

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUsersRepository: Repository<AdminUser>
  ) {
    const salt = process.env.ADMIN_PASSWORD_SALT || '';
    if (salt.length < 16) {
      throw new Error('ADMIN_PASSWORD_SALT must be at least 16 characters');
    }
    this.salt = salt;
  }

  private hashPassword(value: string) {
    return scryptSync(value, this.salt, 32).toString('hex');
  }

  private comparePassword(value: string, hash: string | null | undefined) {
    if (!hash) {
      return false;
    }
    const computed = this.hashPassword(value);
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  }

  async getOrCreate(username: string, initialPassword?: string) {
    let user = await this.adminUsersRepository.findOne({ where: { username } });
    if (!user) {
      user = this.adminUsersRepository.create({
        username,
        role: 'admin',
        status: 'active',
        mustChangePassword: true,
        passwordHash: initialPassword ? this.hashPassword(initialPassword) : null
      });
      user = await this.adminUsersRepository.save(user);
    } else if (!user.passwordHash && initialPassword) {
      user.passwordHash = this.hashPassword(initialPassword);
      user.mustChangePassword = true;
      user = await this.adminUsersRepository.save(user);
    }
    return user;
  }

  async updateProfile(username: string, dto: UpdateProfileDto) {
    const user = await this.getOrCreate(username);
    Object.assign(user, {
      name: dto.name ?? user.name ?? null,
      email: dto.email ?? user.email ?? null
    });
    if (dto.password) {
      user.passwordHash = this.hashPassword(dto.password);
      user.mustChangePassword = false;
    }
    const saved = await this.adminUsersRepository.save(user);
    return this.sanitize(saved);
  }

  async setPasswordById(userId: string, password: string) {
    const user = await this.adminUsersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.passwordHash = this.hashPassword(password);
    user.mustChangePassword = false;
    const saved = await this.adminUsersRepository.save(user);
    return this.sanitize(saved);
  }

  async list() {
    const users = await this.adminUsersRepository.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.sanitize(user));
  }

  async findByIdentifier(identifier: string) {
    return this.adminUsersRepository.findOne({
      where: [{ username: identifier }, { email: identifier }]
    });
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.adminUsersRepository.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ForbiddenException('Username already exists');
    }
    const user = this.adminUsersRepository.create({
      username: dto.username,
      name: dto.name ?? null,
      email: dto.email ?? null,
      role: dto.role ?? 'editor',
      status: dto.status ?? 'active',
      passwordHash: this.hashPassword(dto.password),
      mustChangePassword: true
    });
    const saved = await this.adminUsersRepository.save(user);
    return this.sanitize(saved);
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const user = await this.adminUsersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, {
      name: dto.name ?? user.name ?? null,
      email: dto.email ?? user.email ?? null,
      role: dto.role ?? user.role,
      status: dto.status ?? user.status
    });
    if (dto.password) {
      user.passwordHash = this.hashPassword(dto.password);
      user.mustChangePassword = true;
    }
    const saved = await this.adminUsersRepository.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string, currentUsername?: string | null) {
    const user = await this.adminUsersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUsername && user.username === currentUsername) {
      throw new ForbiddenException('Cannot delete your own user');
    }
    await this.adminUsersRepository.delete({ id });
    return this.sanitize(user);
  }

  async validateCredentials(identifier: string, password: string) {
    const user = await this.adminUsersRepository.findOne({
      where: [{ username: identifier }, { email: identifier }]
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.comparePassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private sanitize(user: AdminUser) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
