import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private usingTestAccount = false;

  constructor(private readonly configService: ConfigService) {}

  private async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      this.usingTestAccount = true;
      this.logger.log('SMTP_HOST not set. Using Ethereal test account for email previews.');
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<string>('SMTP_PORT') || 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS')
          }
        : undefined
    });

    return this.transporter;
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const transporter = await this.getTransporter();
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@provider-manager.local';

    const info = await transporter.sendMail({
      to: email,
      from,
      subject: 'Recuperar contraseña - Provider Manager IA',
      text: `Usa este enlace para restablecer tu contraseña: ${resetUrl}`,
      html: `
        <p>Usa este enlace para restablecer tu contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      `
    });

    if (this.usingTestAccount) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        this.logger.log(`Preview de email disponible en: ${url}`);
      }
    }
  }

  async sendSubscriptionPaymentEmail(
    email: string,
    paymentUrl: string,
    tenantName: string,
    totalEur: number
  ) {
    const transporter = await this.getTransporter();
    const from = this.configService.get<string>('SMTP_FROM') || 'no-reply@provider-manager.local';

    const info = await transporter.sendMail({
      to: email,
      from,
      subject: `Confirmar suscripción - ${tenantName}`,
      text: `Para activar la suscripción de ${tenantName}, completa el pago aquí: ${paymentUrl}`,
      html: `
        <p>Para activar la suscripción de <strong>${tenantName}</strong>, completa el pago:</p>
        <p><a href="${paymentUrl}">${paymentUrl}</a></p>
        <p>Importe total: ${totalEur.toFixed(2)} EUR</p>
      `
    });

    if (this.usingTestAccount) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        this.logger.log(`Preview de email disponible en: ${url}`);
      }
    }
  }
}
