import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatUser } from '../common/entities/chat-user.entity';
import { ServiceCatalog } from '../common/entities/service-catalog.entity';
import { Subscription } from '../common/entities/subscription.entity';
import { SubscriptionService } from '../common/entities/subscription-service.entity';
import { TenantServiceConfig, TenantServiceStatus } from '../common/entities/tenant-service-config.entity';
import { TenantServiceEndpoint } from '../common/entities/tenant-service-endpoint.entity';
import { TenantServiceUser, TenantServiceUserStatus } from '../common/entities/tenant-service-user.entity';
import { TenantsService } from '../tenants/tenants.service';

const DEFAULT_STATUS: TenantServiceStatus = 'active';

@Injectable()
export class TenantServicesService {
  constructor(
    @InjectRepository(TenantServiceConfig)
    private readonly configRepository: Repository<TenantServiceConfig>,
    @InjectRepository(TenantServiceEndpoint)
    private readonly endpointRepository: Repository<TenantServiceEndpoint>,
    @InjectRepository(TenantServiceUser)
    private readonly serviceUserRepository: Repository<TenantServiceUser>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionService)
    private readonly subscriptionServiceRepository: Repository<SubscriptionService>,
    @InjectRepository(ServiceCatalog)
    private readonly serviceCatalogRepository: Repository<ServiceCatalog>,
    @InjectRepository(ChatUser)
    private readonly chatUsersRepository: Repository<ChatUser>,
    private readonly tenantsService: TenantsService
  ) {}

  private async ensureTenant(tenantId: string) {
    const tenant = await this.tenantsService.getById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private async getSubscriptionServices(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!subscription) {
      return [];
    }
    return this.subscriptionServiceRepository.find({ where: { subscriptionId: subscription.id } });
  }

  private async ensureConfig(tenantId: string, serviceCode: string) {
    let config = await this.configRepository.findOne({ where: { tenantId, serviceCode } });
    if (!config) {
      config = this.configRepository.create({
        tenantId,
        serviceCode,
        status: DEFAULT_STATUS,
        systemPrompt: null
      });
      config = await this.configRepository.save(config);
    }
    return config;
  }

  private normalizeServiceCode(value: string) {
    return value.trim();
  }

  async listServices(tenantId: string) {
    await this.ensureTenant(tenantId);
    const catalog = await this.serviceCatalogRepository.find({ order: { name: 'ASC' } });
    const subscriptionServices = await this.getSubscriptionServices(tenantId);
    const subscriptionMap = new Map(subscriptionServices.map((item) => [item.serviceCode, item]));
    const configs = await this.configRepository.find({ where: { tenantId } });
    const configMap = new Map(configs.map((item) => [item.serviceCode, item]));

    const results = [];
    for (const service of catalog) {
      const subscription = subscriptionMap.get(service.code);
      let config = configMap.get(service.code) || null;
      if (subscription && !config) {
        config = await this.ensureConfig(tenantId, service.code);
      }
      const userCount = await this.serviceUserRepository.count({
        where: { tenantId, serviceCode: service.code }
      });
      const endpointCount = await this.endpointRepository.count({
        where: { tenantId, serviceCode: service.code }
      });

      results.push({
        serviceCode: service.code,
        name: service.name,
        description: service.description,
        priceMonthlyEur: Number(service.priceMonthlyEur || 0),
        priceAnnualEur: Number(service.priceAnnualEur || 0),
        subscriptionStatus: subscription?.status || 'disabled',
        activateAt: subscription?.activateAt || null,
        deactivateAt: subscription?.deactivateAt || null,
        configStatus: config?.status || DEFAULT_STATUS,
        systemPrompt: config?.systemPrompt || null,
        userCount,
        endpointCount
      });
    }
    return results;
  }

  async updateConfig(tenantId: string, serviceCode: string, status?: TenantServiceStatus, systemPrompt?: string | null) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const config = await this.ensureConfig(tenantId, normalized);
    if (status) {
      config.status = status;
    }
    if (systemPrompt !== undefined) {
      config.systemPrompt = systemPrompt?.trim() || null;
    }
    return this.configRepository.save(config);
  }

  async listEndpoints(tenantId: string, serviceCode: string) {
    await this.ensureTenant(tenantId);
    return this.endpointRepository.find({
      where: { tenantId, serviceCode: this.normalizeServiceCode(serviceCode) },
      order: { createdAt: 'DESC' }
    });
  }

  async createEndpoint(
    tenantId: string,
    serviceCode: string,
    payload: {
      slug: string;
      method: string;
      path: string;
      baseUrl?: string | null;
      headers?: Record<string, string> | null;
      enabled?: boolean;
    }
  ) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    await this.ensureConfig(tenantId, normalized);

    const created = this.endpointRepository.create({
      tenantId,
      serviceCode: normalized,
      slug: payload.slug.trim(),
      method: payload.method.trim().toUpperCase(),
      path: payload.path.trim(),
      baseUrl: payload.baseUrl?.trim() || null,
      headers: payload.headers || null,
      enabled: payload.enabled ?? true
    });
    return this.endpointRepository.save(created);
  }

  async updateEndpoint(
    tenantId: string,
    serviceCode: string,
    id: string,
    payload: {
      slug?: string;
      method?: string;
      path?: string;
      baseUrl?: string | null;
      headers?: Record<string, string> | null;
      enabled?: boolean;
    }
  ) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const endpoint = await this.endpointRepository.findOne({
      where: { id, tenantId, serviceCode: normalized }
    });
    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }
    if (payload.slug) {
      endpoint.slug = payload.slug.trim();
    }
    if (payload.method) {
      endpoint.method = payload.method.trim().toUpperCase();
    }
    if (payload.path) {
      endpoint.path = payload.path.trim();
    }
    if (payload.baseUrl !== undefined) {
      endpoint.baseUrl = payload.baseUrl?.trim() || null;
    }
    if (payload.headers !== undefined) {
      endpoint.headers = payload.headers || null;
    }
    if (payload.enabled !== undefined) {
      endpoint.enabled = payload.enabled;
    }
    return this.endpointRepository.save(endpoint);
  }

  async deleteEndpoint(tenantId: string, serviceCode: string, id: string) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const endpoint = await this.endpointRepository.findOne({
      where: { id, tenantId, serviceCode: normalized }
    });
    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }
    await this.endpointRepository.delete({ id: endpoint.id });
    return { deleted: true };
  }

  async listServiceUsers(tenantId: string, serviceCode: string) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const assignments = await this.serviceUserRepository.find({
      where: { tenantId, serviceCode: normalized },
      order: { createdAt: 'DESC' }
    });
    if (assignments.length === 0) {
      return [];
    }
    const userIds = assignments.map((item) => item.userId);
    const users = await this.chatUsersRepository.find({
      where: { tenantId, id: In(userIds) }
    });
    const userMap = new Map(users.map((item) => [item.id, item]));
    return assignments
      .map((assignment) => {
        const user = userMap.get(assignment.userId);
        if (!user) {
          return null;
        }
        return {
          userId: assignment.userId,
          status: assignment.status,
          user: {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            name: user.name,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        };
      })
      .filter(Boolean);
  }

  async assignUser(tenantId: string, serviceCode: string, userId: string, status?: TenantServiceUserStatus) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const user = await this.chatUsersRepository.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.ensureConfig(tenantId, normalized);

    let assignment = await this.serviceUserRepository.findOne({
      where: { tenantId, serviceCode: normalized, userId }
    });
    if (!assignment) {
      assignment = this.serviceUserRepository.create({
        tenantId,
        serviceCode: normalized,
        userId,
        status: status || 'active'
      });
    } else if (status) {
      assignment.status = status;
    }
    await this.serviceUserRepository.save(assignment);
    return assignment;
  }

  async updateServiceUser(
    tenantId: string,
    serviceCode: string,
    userId: string,
    status: TenantServiceUserStatus
  ) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const assignment = await this.serviceUserRepository.findOne({
      where: { tenantId, serviceCode: normalized, userId }
    });
    if (!assignment) {
      throw new NotFoundException('User assignment not found');
    }
    assignment.status = status;
    return this.serviceUserRepository.save(assignment);
  }

  async removeServiceUser(tenantId: string, serviceCode: string, userId: string) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    await this.serviceUserRepository.delete({ tenantId, serviceCode: normalized, userId });
    return { deleted: true };
  }

  async removeUserFromAllServices(tenantId: string, userId: string) {
    await this.serviceUserRepository.delete({ tenantId, userId });
  }

  async listServicesForUser(tenantId: string, userId: string) {
    await this.ensureTenant(tenantId);
    const assignments = await this.serviceUserRepository.find({
      where: { tenantId, userId }
    });
    if (assignments.length === 0) {
      return [];
    }
    const codes = assignments.map((item) => item.serviceCode);
    const catalog = await this.serviceCatalogRepository.find({ where: { code: In(codes) } });
    const catalogMap = new Map(catalog.map((item) => [item.code, item]));
    const configs = await this.configRepository.find({ where: { tenantId, serviceCode: In(codes) } });
    const configMap = new Map(configs.map((item) => [item.serviceCode, item]));
    const subscriptionServices = await this.getSubscriptionServices(tenantId);
    const subscriptionMap = new Map(subscriptionServices.map((item) => [item.serviceCode, item]));

    return assignments.map((assignment) => {
      const catalogItem = catalogMap.get(assignment.serviceCode);
      const config = configMap.get(assignment.serviceCode);
      const subscription = subscriptionMap.get(assignment.serviceCode);
      const subscriptionStatus = subscription?.status || 'disabled';
      const operationalStatus =
        assignment.status === 'suspended' || config?.status === 'suspended' ? 'suspended' : 'active';
      return {
        serviceCode: assignment.serviceCode,
        name: catalogItem?.name || assignment.serviceCode,
        description: catalogItem?.description || '',
        subscriptionStatus,
        activateAt: subscription?.activateAt || null,
        deactivateAt: subscription?.deactivateAt || null,
        status: operationalStatus
      };
    });
  }

  async requireServiceAccess(tenantId: string, serviceCode: string, userId: string) {
    await this.ensureTenant(tenantId);
    const normalized = this.normalizeServiceCode(serviceCode);
    const subscriptionServices = await this.getSubscriptionServices(tenantId);
    const subscription = subscriptionServices.find((item) => item.serviceCode === normalized);
    if (!subscription) {
      throw new ForbiddenException('Service not subscribed');
    }
    if (subscription.status === 'pending') {
      throw new ForbiddenException('Service pending activation');
    }

    const config = await this.ensureConfig(tenantId, normalized);
    if (config.status === 'suspended') {
      throw new ForbiddenException('Service is suspended');
    }

    const assignment = await this.serviceUserRepository.findOne({
      where: { tenantId, serviceCode: normalized, userId }
    });
    if (!assignment || assignment.status !== 'active') {
      throw new ForbiddenException('User not allowed for this service');
    }

    return {
      config,
      subscription
    };
  }
}
