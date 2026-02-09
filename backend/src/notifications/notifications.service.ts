import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationChannel } from '../common/entities/notification-channel.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';
import nodemailer from 'nodemailer';

export type UsageAlertPayload = {
  tenantId: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  limit?: number;
};

@Injectable()
export class NotificationsService {
  private transporter?: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelsRepository: Repository<NotificationChannel>,
    private readonly encryptionService: EncryptionService
  ) {}

  async list() {
    const channels = await this.channelsRepository.find({ order: { createdAt: 'DESC' } });
    return channels.map((channel) => this.sanitize(channel));
  }

  async create(dto: CreateNotificationChannelDto) {
    const channel = this.channelsRepository.create({
      tenantId: dto.tenantId ?? null,
      type: dto.type,
      config: {
        name: dto.name ?? dto.type.toUpperCase(),
        recipients: dto.recipients ?? []
      },
      encryptedSecret: dto.webhookUrl
        ? this.encryptionService.encrypt(dto.webhookUrl)
        : null,
      enabled: dto.enabled ?? true
    });

    const saved = await this.channelsRepository.save(channel);
    return this.sanitize(saved);
  }

  async update(id: string, dto: UpdateNotificationChannelDto) {
    const channel = await this.channelsRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('Notification channel not found');
    }

    channel.tenantId = dto.tenantId ?? channel.tenantId;
    channel.type = (dto.type as any) ?? channel.type;
    channel.enabled = dto.enabled ?? channel.enabled;

    channel.config = {
      ...(channel.config || {}),
      name: dto.name ?? (channel.config?.name as string) ?? channel.type.toUpperCase(),
      recipients: dto.recipients ?? (channel.config?.recipients as string[]) ?? []
    };

    if (dto.webhookUrl !== undefined) {
      channel.encryptedSecret = dto.webhookUrl
        ? this.encryptionService.encrypt(dto.webhookUrl)
        : null;
    }

    const saved = await this.channelsRepository.save(channel);
    return this.sanitize(saved);
  }

  async sendAlerts(tenantId: string, alerts: UsageAlertPayload[]) {
    if (alerts.length === 0) {
      return { sent: 0 };
    }

    const channels = await this.channelsRepository.find({
      where: [{ tenantId }, { tenantId: IsNull() }]
    });

    const enabled = channels.filter((channel) => channel.enabled);
    const message = this.buildMessage(tenantId, alerts);

    let sent = 0;
    for (const channel of enabled) {
      if (channel.type === 'email') {
        const recipients = (channel.config?.recipients as string[]) || [];
        const ok = await this.sendEmail(recipients, message);
        if (ok) {
          sent += 1;
        }
      }
      if (channel.type === 'slack') {
        const webhookUrl = channel.encryptedSecret
          ? this.encryptionService.decrypt(channel.encryptedSecret)
          : '';
        const ok = await this.sendSlack(webhookUrl, message);
        if (ok) {
          sent += 1;
        }
      }
    }

    return { sent };
  }

  private sanitize(channel: NotificationChannel) {
    return {
      id: channel.id,
      tenantId: channel.tenantId,
      type: channel.type,
      config: channel.config,
      enabled: channel.enabled,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    };
  }

  private buildMessage(tenantId: string, alerts: UsageAlertPayload[]) {
    const lines = alerts.map((alert) => {
      const value = alert.value !== undefined && alert.limit !== undefined
        ? ` (${alert.value}/${alert.limit})`
        : '';
      return `• [${alert.severity.toUpperCase()}] ${alert.message}${value}`;
    });
    return `Alertas Provider Manager IA\nTenant: ${tenantId}\n${lines.join('\n')}`;
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    if (!host) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });

    return this.transporter;
  }

  private async sendEmail(recipients: string[], message: string) {
    if (recipients.length === 0) {
      return false;
    }
    const transporter = this.getTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@provider-manager.local',
      to: recipients.join(','),
      subject: 'Alertas Provider Manager IA',
      text: message
    });

    return true;
  }

  private async sendSlack(webhookUrl: string, message: string) {
    if (!webhookUrl) {
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });

    return response.ok;
  }
}
