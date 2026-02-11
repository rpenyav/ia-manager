import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import Stripe from 'stripe';
import { ServiceCatalog } from '../common/entities/service-catalog.entity';
import { Subscription } from '../common/entities/subscription.entity';
import { SubscriptionHistory } from '../common/entities/subscription-history.entity';
import { SubscriptionService } from '../common/entities/subscription-service.entity';
import { SubscriptionPaymentRequest } from '../common/entities/subscription-payment-request.entity';
import { EmailService } from '../common/services/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionService)
    private readonly subscriptionServicesRepository: Repository<SubscriptionService>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepository: Repository<SubscriptionHistory>,
    @InjectRepository(SubscriptionPaymentRequest)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPaymentRequest>,
    @InjectRepository(ServiceCatalog)
    private readonly catalogRepository: Repository<ServiceCatalog>,
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  private buildPeriodEnd(start: Date, period: 'monthly' | 'annual') {
    return period === 'annual' ? addYears(start, 1) : addMonths(start, 1);
  }

  private countPeriods(start: Date, end: Date, period: 'monthly' | 'annual') {
    if (end < start) {
      return 0;
    }
    if (period === 'annual') {
      const years = end.getFullYear() - start.getFullYear();
      const reached =
        end.getMonth() > start.getMonth() ||
        (end.getMonth() === start.getMonth() && end.getDate() >= start.getDate());
      return years + (reached ? 1 : 0);
    }
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const reached = end.getDate() >= start.getDate();
    return months + (reached ? 1 : 0);
  }

  private async reconcileServiceStates(subscriptionId: string) {
    const now = new Date();
    const pending = await this.subscriptionServicesRepository.find({
      where: {
        subscriptionId,
        status: 'pending',
        activateAt: LessThanOrEqual(now)
      }
    });
    if (pending.length > 0) {
      pending.forEach((item) => {
        item.status = 'active';
        item.activateAt = null;
      });
      await this.subscriptionServicesRepository.save(pending);
    }

    const pendingRemoval = await this.subscriptionServicesRepository.find({
      where: {
        subscriptionId,
        status: 'pending_removal',
        deactivateAt: LessThanOrEqual(now)
      }
    });
    if (pendingRemoval.length > 0) {
      await this.subscriptionServicesRepository.delete({
        id: In(pendingRemoval.map((item) => item.id))
      });
    }
  }

  private async buildResponse(subscription: Subscription | null) {
    if (!subscription) {
      return { subscription: null, services: [], totals: null };
    }

    await this.reconcileServiceStates(subscription.id);

    const services = await this.subscriptionServicesRepository.find({
      where: { subscriptionId: subscription.id }
    });
    const catalog = services.length
      ? await this.catalogRepository.find({
          where: { code: In(services.map((item) => item.serviceCode)) }
        })
      : [];
    const catalogMap = new Map(catalog.map((item) => [item.code, item]));

    const activeServices = services.filter(
      (item) => item.status === 'active' || item.status === 'pending_removal'
    );
    const servicesTotal = activeServices.reduce((sum, item) => sum + Number(item.priceEur || 0), 0);
    const basePrice = Number(subscription.basePriceEur || 0);
    const now = new Date();
    const endDate =
      subscription.status === 'cancelled'
        ? subscription.currentPeriodEnd
        : now;
    const periods = subscription.status === 'pending'
      ? 0
      : this.countPeriods(subscription.currentPeriodStart, endDate, subscription.period);
    const billedSinceStart = periods * (basePrice + servicesTotal);

    const responseServices = services.map((item) => {
      const catalogItem = catalogMap.get(item.serviceCode);
      return {
        serviceCode: item.serviceCode,
        status: item.status,
        activateAt: item.activateAt,
        deactivateAt: item.deactivateAt,
        priceEur: Number(item.priceEur || 0),
        name: catalogItem?.name,
        description: catalogItem?.description,
        priceMonthlyEur: catalogItem?.priceMonthlyEur,
        priceAnnualEur: catalogItem?.priceAnnualEur
      };
    });

    return {
      subscription,
      services: responseServices,
      totals: {
        basePriceEur: basePrice,
        servicesPriceEur: servicesTotal,
        totalEur: basePrice + servicesTotal,
        billedSinceStartEur: billedSinceStart
      }
    };
  }

  private getBillingMode() {
    const explicit = this.configService.get<string>('BILLING_PAYMENT_MODE');
    if (explicit === 'stripe' || explicit === 'mock') {
      return explicit;
    }
    const env = this.configService.get<string>('APP_ENV') || 'development';
    return env === 'development' ? 'mock' : 'stripe';
  }

  private getPaymentExpiresAt() {
    const ttlHours = Number(this.configService.get<string>('SUBSCRIPTION_PAYMENT_TTL_HOURS') || 48);
    const expires = new Date();
    expires.setHours(expires.getHours() + (Number.isFinite(ttlHours) ? ttlHours : 48));
    return expires;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createStripeCheckoutSession(payload: {
    tenantName: string;
    email: string;
    period: 'monthly' | 'annual';
    basePriceEur: number;
    services: { name: string; priceEur: number }[];
    paymentRequestId: string;
  }) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      throw new BadRequestException('Stripe not configured');
    }
    const stripe = new Stripe(secret, { apiVersion: '2026-01-28.clover' });
    const successUrl =
      this.configService.get<string>('STRIPE_SUCCESS_URL') ||
      `${this.configService.get<string>('FRONTEND_BASE_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      this.configService.get<string>('STRIPE_CANCEL_URL') ||
      `${this.configService.get<string>('FRONTEND_BASE_URL')}/billing/cancel`;

    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(payload.basePriceEur * 100),
          product_data: {
            name: `Suscripción base (${payload.period})`
          }
        },
        quantity: 1
      },
      ...payload.services.map((service) => ({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(service.priceEur * 100),
          product_data: {
            name: service.name
          }
        },
        quantity: 1
      }))
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: payload.email,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentRequestId: payload.paymentRequestId,
        tenantName: payload.tenantName
      }
    });
    return session;
  }

  private async createPaymentRequest(params: {
    tenantId: string;
    subscriptionId: string;
    email: string;
    amountEur: number;
    services: { name: string; priceEur: number }[];
    tenantName: string;
    period: 'monthly' | 'annual';
  }) {
    const token = randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    const provider = this.getBillingMode();
    const payment = this.subscriptionPaymentRepository.create({
      tenantId: params.tenantId,
      subscriptionId: params.subscriptionId,
      email: params.email,
      status: 'pending',
      provider,
      tokenHash,
      amountEur: params.amountEur,
      expiresAt: this.getPaymentExpiresAt(),
      providerRef: null,
      completedAt: null
    });
    const saved = await this.subscriptionPaymentRepository.save(payment);

    let paymentUrl = `${this.configService.get<string>('FRONTEND_BASE_URL')}/billing/confirm?token=${token}`;
    if (provider === 'stripe') {
      const session = await this.createStripeCheckoutSession({
        tenantName: params.tenantName,
        email: params.email,
        period: params.period,
        basePriceEur: params.amountEur - params.services.reduce((sum, item) => sum + item.priceEur, 0),
        services: params.services,
        paymentRequestId: saved.id
      });
      saved.providerRef = session.id;
      await this.subscriptionPaymentRepository.save(saved);
      paymentUrl = session.url || paymentUrl;
    }

    await this.emailService.sendSubscriptionPaymentEmail(
      params.email,
      paymentUrl,
      params.tenantName,
      params.amountEur
    );

    return { paymentUrl, token };
  }

  async getByTenantId(tenantId: string) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId }
    });
    return this.buildResponse(subscription);
  }

  async create(tenantId: string, dto: CreateSubscriptionDto) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (!tenant.billingEmail) {
      throw new BadRequestException('Tenant billing email required');
    }

    const existing = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (existing && existing.status !== 'cancelled') {
      return this.update(tenantId, {
        period: dto.period,
        basePriceEur: dto.basePriceEur,
        serviceCodes: dto.serviceCodes,
        cancelAtPeriodEnd: dto.cancelAtPeriodEnd
      });
    }

    const codes = Array.from(new Set(dto.serviceCodes || []));
    if (codes.length > 0) {
      const catalog = await this.catalogRepository.find({ where: { code: In(codes) } });
      if (catalog.length !== codes.length) {
        throw new NotFoundException('One or more services not found');
      }
    }

    const now = new Date();
    let saved: Subscription;
    if (existing && existing.status === 'cancelled') {
      existing.status = 'pending';
      existing.period = dto.period;
      existing.basePriceEur = dto.basePriceEur;
      existing.currency = 'EUR';
      existing.currentPeriodStart = now;
      existing.currentPeriodEnd = this.buildPeriodEnd(now, dto.period);
      existing.cancelAtPeriodEnd = false;
      saved = await this.subscriptionRepository.save(existing);
      await this.subscriptionServicesRepository.delete({ subscriptionId: saved.id });
    } else {
      const subscription = this.subscriptionRepository.create({
        tenantId,
        status: 'pending',
        period: dto.period,
        basePriceEur: dto.basePriceEur,
        currency: 'EUR',
        currentPeriodStart: now,
        currentPeriodEnd: this.buildPeriodEnd(now, dto.period),
        cancelAtPeriodEnd: false
      });
      saved = await this.subscriptionRepository.save(subscription);
    }

    if (codes.length > 0) {
      const catalog = await this.catalogRepository.find({ where: { code: In(codes) } });
      const rows = catalog.map((service) =>
        this.subscriptionServicesRepository.create({
          subscriptionId: saved.id,
          serviceCode: service.code,
          status: 'pending',
          activateAt: null,
          deactivateAt: null,
          priceEur: dto.period === 'annual' ? service.priceAnnualEur : service.priceMonthlyEur
        })
      );
      await this.subscriptionServicesRepository.save(rows);
    }

    const services = await this.catalogRepository.find({ where: { code: In(codes) } });
    const servicesSummary = services.map((service) => ({
      name: service.name,
      priceEur: dto.period === 'annual' ? service.priceAnnualEur : service.priceMonthlyEur
    }));
    const amountEur =
      Number(dto.basePriceEur || 0) +
      servicesSummary.reduce((sum, item) => sum + Number(item.priceEur || 0), 0);

    await this.createPaymentRequest({
      tenantId,
      subscriptionId: saved.id,
      email: tenant.billingEmail,
      amountEur,
      services: servicesSummary,
      tenantName: tenant.name,
      period: dto.period
    });

    return this.buildResponse(saved);
  }

  async update(tenantId: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (dto.period && dto.period !== subscription.period) {
      subscription.period = dto.period;
      subscription.currentPeriodEnd = this.buildPeriodEnd(subscription.currentPeriodStart, dto.period);
    }
    if (dto.basePriceEur !== undefined) {
      subscription.basePriceEur = dto.basePriceEur;
    }
    if (dto.status) {
      subscription.status = dto.status;
    }
    if (dto.cancelAtPeriodEnd !== undefined) {
      subscription.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
    }
    await this.subscriptionRepository.save(subscription);

    const now = new Date();

    if (dto.removeServiceCodes && dto.removeServiceCodes.length > 0) {
      const uniqueCodes = Array.from(new Set(dto.removeServiceCodes));
      const existingToRemove = await this.subscriptionServicesRepository.find({
        where: { subscriptionId: subscription.id, serviceCode: In(uniqueCodes) }
      });
      if (existingToRemove.length > 0) {
        const shouldSchedule = subscription.status === 'active' && now < subscription.currentPeriodEnd;
        const toDelete = existingToRemove.filter((item) => item.status === 'pending');
        const toSchedule = existingToRemove.filter(
          (item) => item.status === 'active' || item.status === 'pending_removal'
        );
        if (toDelete.length > 0) {
          await this.subscriptionServicesRepository.delete({
            id: In(toDelete.map((item) => item.id))
          });
        }
        if (toSchedule.length > 0) {
          if (!shouldSchedule) {
            await this.subscriptionServicesRepository.delete({
              id: In(toSchedule.map((item) => item.id))
            });
          } else {
            toSchedule.forEach((item) => {
              item.status = 'pending_removal';
              item.deactivateAt = subscription.currentPeriodEnd;
            });
            await this.subscriptionServicesRepository.save(toSchedule);
          }
        }
      }
    }

    if (dto.serviceCodes) {
      const codes = Array.from(new Set(dto.serviceCodes));
      const catalog = codes.length
        ? await this.catalogRepository.find({ where: { code: In(codes) } })
        : [];
      if (catalog.length !== codes.length) {
        throw new NotFoundException('One or more services not found');
      }

      const existing = await this.subscriptionServicesRepository.find({
        where: { subscriptionId: subscription.id }
      });
      const existingCodes = new Set(existing.map((item) => item.serviceCode));

      const toRestore = existing.filter(
        (item) => item.status === 'pending_removal' && codes.includes(item.serviceCode)
      );
      if (toRestore.length > 0) {
        toRestore.forEach((item) => {
          item.status = 'active';
          item.deactivateAt = null;
        });
        await this.subscriptionServicesRepository.save(toRestore);
      }
      const toAdd = catalog.filter((item) => !existingCodes.has(item.code));
      if (toAdd.length > 0) {
        const rows = toAdd.map((service) => {
          const isPending =
            subscription.status !== 'active' ||
            (subscription.status === 'active' && now < subscription.currentPeriodEnd);
          return this.subscriptionServicesRepository.create({
            subscriptionId: subscription.id,
            serviceCode: service.code,
            status: isPending ? 'pending' : 'active',
            activateAt: isPending ? subscription.currentPeriodEnd : null,
            deactivateAt: null,
            priceEur: subscription.period === 'annual' ? service.priceAnnualEur : service.priceMonthlyEur
          });
        });
        await this.subscriptionServicesRepository.save(rows);
      }
    }

    if (dto.status === 'cancelled') {
      await this.createHistoryFromSubscription(subscription);
    }

    return this.buildResponse(subscription);
  }

  private async createHistoryFromSubscription(subscription: Subscription) {
    const existing = await this.subscriptionHistoryRepository.findOne({
      where: { subscriptionId: subscription.id, startedAt: subscription.currentPeriodStart }
    });
    if (existing) {
      return;
    }
    const services = await this.subscriptionServicesRepository.find({
      where: { subscriptionId: subscription.id, status: In(['active', 'pending_removal']) }
    });
    const servicesTotal = services.reduce((sum, item) => sum + Number(item.priceEur || 0), 0);
    const basePrice = Number(subscription.basePriceEur || 0);
    const endDate = subscription.cancelAtPeriodEnd
      ? subscription.currentPeriodEnd
      : new Date();
    const periods = this.countPeriods(subscription.currentPeriodStart, endDate, subscription.period);
    const totalBilled = periods * (basePrice + servicesTotal);
    const history = this.subscriptionHistoryRepository.create({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      period: subscription.period,
      basePriceEur: basePrice,
      servicesPriceEur: servicesTotal,
      totalBilledEur: totalBilled,
      startedAt: subscription.currentPeriodStart,
      endedAt: endDate
    });
    await this.subscriptionHistoryRepository.save(history);
  }

  async confirmPaymentByToken(token: string) {
    const tokenHash = this.hashToken(token);
    const request = await this.subscriptionPaymentRepository.findOne({
      where: { tokenHash, status: 'pending' }
    });
    if (!request) {
      throw new NotFoundException('Payment request not found');
    }
    if (request.expiresAt < new Date()) {
      request.status = 'expired';
      await this.subscriptionPaymentRepository.save(request);
      throw new BadRequestException('Payment request expired');
    }
    return this.activateSubscription(request);
  }

  async confirmStripeSession(sessionId: string) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      throw new BadRequestException('Stripe not configured');
    }
    const stripe = new Stripe(secret, { apiVersion: '2026-01-28.clover' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }
    const paymentRequestId = session.metadata?.paymentRequestId;
    if (!paymentRequestId) {
      throw new BadRequestException('Payment request metadata missing');
    }
    const request = await this.subscriptionPaymentRepository.findOne({
      where: { id: paymentRequestId, status: 'pending' }
    });
    if (!request) {
      throw new NotFoundException('Payment request not found');
    }
    return this.activateSubscription(request);
  }

  async approvePaymentByAdmin(tenantId: string) {
    const request = await this.subscriptionPaymentRepository.findOne({
      where: { tenantId, status: 'pending' },
      order: { createdAt: 'DESC' }
    });
    if (!request) {
      throw new NotFoundException('No pending payment requests');
    }
    return this.activateSubscription(request);
  }

  private async activateSubscription(request: SubscriptionPaymentRequest) {
    request.status = 'completed';
    request.completedAt = new Date();
    await this.subscriptionPaymentRepository.save(request);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: request.subscriptionId }
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    const now = new Date();
    subscription.status = 'active';
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = this.buildPeriodEnd(now, subscription.period);
    subscription.cancelAtPeriodEnd = false;
    await this.subscriptionRepository.save(subscription);

    const pending = await this.subscriptionServicesRepository.find({
      where: { subscriptionId: subscription.id, status: 'pending' }
    });
    if (pending.length > 0) {
      pending.forEach((item) => {
        item.status = 'active';
        item.activateAt = null;
      });
      await this.subscriptionServicesRepository.save(pending);
    }

    return this.buildResponse(subscription);
  }

  async listAdminSummary() {
    const tenants = await this.tenantsService.list();
    const subscriptions = await this.subscriptionRepository.find();
    const services = await this.subscriptionServicesRepository.find();
    const histories = await this.subscriptionHistoryRepository.find();

    const subscriptionMap = new Map(subscriptions.map((item) => [item.tenantId, item]));
    const servicesBySub = new Map<string, SubscriptionService[]>();
    services.forEach((item) => {
      const list = servicesBySub.get(item.subscriptionId) || [];
      list.push(item);
      servicesBySub.set(item.subscriptionId, list);
    });
    const historyTotals = new Map<string, number>();
    histories.forEach((entry) => {
      historyTotals.set(
        entry.tenantId,
        (historyTotals.get(entry.tenantId) || 0) + Number(entry.totalBilledEur || 0)
      );
    });

    const now = new Date();
    return tenants.map((tenant) => {
      const subscription = subscriptionMap.get(tenant.id) || null;
      if (!subscription) {
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          subscription: null,
          currentTotalEur: 0,
          billedSinceStartEur: 0,
          historyTotalEur: historyTotals.get(tenant.id) || 0
        };
      }
      const serviceList = servicesBySub.get(subscription.id) || [];
      const activeServices = serviceList.filter((item) => item.status === 'active');
      const servicesTotal = activeServices.reduce((sum, item) => sum + Number(item.priceEur || 0), 0);
      const basePrice = Number(subscription.basePriceEur || 0);
      const endDate = subscription.status === 'cancelled' ? subscription.currentPeriodEnd : now;
      const periods = this.countPeriods(subscription.currentPeriodStart, endDate, subscription.period);
      const currentTotal = basePrice + servicesTotal;

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        subscription,
        currentTotalEur: currentTotal,
        billedSinceStartEur: periods * currentTotal,
        historyTotalEur: historyTotals.get(tenant.id) || 0
      };
    });
  }
}
