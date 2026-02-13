package com.neria.manager.tenantservices;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ChatUser;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.Subscription;
import com.neria.manager.common.entities.SubscriptionService;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceEndpoint;
import com.neria.manager.common.entities.TenantServiceUser;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.repos.ChatUserRepository;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.SubscriptionRepository;
import com.neria.manager.common.repos.SubscriptionServiceRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEndpointRepository;
import com.neria.manager.common.repos.TenantServiceUserRepository;
import com.neria.manager.tenants.TenantsService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantServicesService {
  private static final String DEFAULT_STATUS = "active";
  private final TenantServiceConfigRepository configRepository;
  private final TenantServiceEndpointRepository endpointRepository;
  private final TenantServiceUserRepository serviceUserRepository;
  private final SubscriptionRepository subscriptionRepository;
  private final SubscriptionServiceRepository subscriptionServiceRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final ChatUserRepository chatUsersRepository;
  private final TenantsService tenantsService;
  private final ObjectMapper objectMapper;

  public TenantServicesService(
      TenantServiceConfigRepository configRepository,
      TenantServiceEndpointRepository endpointRepository,
      TenantServiceUserRepository serviceUserRepository,
      SubscriptionRepository subscriptionRepository,
      SubscriptionServiceRepository subscriptionServiceRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      ChatUserRepository chatUsersRepository,
      TenantsService tenantsService,
      ObjectMapper objectMapper) {
    this.configRepository = configRepository;
    this.endpointRepository = endpointRepository;
    this.serviceUserRepository = serviceUserRepository;
    this.subscriptionRepository = subscriptionRepository;
    this.subscriptionServiceRepository = subscriptionServiceRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.chatUsersRepository = chatUsersRepository;
    this.tenantsService = tenantsService;
    this.objectMapper = objectMapper;
  }

  private Tenant ensureTenant(String tenantId) {
    Tenant tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    return tenant;
  }

  private List<SubscriptionService> getSubscriptionServices(String tenantId) {
    return subscriptionRepository.findByTenantId(tenantId)
        .map(sub -> subscriptionServiceRepository.findBySubscriptionId(sub.getId()))
        .orElse(List.of());
  }

  private TenantServiceConfig ensureConfig(String tenantId, String serviceCode) {
    return configRepository
        .findByTenantIdAndServiceCode(tenantId, serviceCode)
        .orElseGet(
            () -> {
              TenantServiceConfig config = new TenantServiceConfig();
              config.setId(UUID.randomUUID().toString());
              config.setTenantId(tenantId);
              config.setServiceCode(serviceCode);
              config.setStatus(DEFAULT_STATUS);
              config.setSystemPrompt(null);
              config.setApiBaseUrl(null);
              config.setProviderId(null);
              config.setPricingId(null);
              config.setPolicyId(null);
              config.setCreatedAt(LocalDateTime.now());
              config.setUpdatedAt(LocalDateTime.now());
              return configRepository.save(config);
            });
  }

  private String normalizeServiceCode(String value) {
    return value == null ? "" : value.trim();
  }

  private ServiceCatalog requireService(String serviceCode) {
    return serviceCatalogRepository
        .findByCode(serviceCode)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
  }

  private void requireEndpointsEnabled(String serviceCode) {
    ServiceCatalog service = requireService(serviceCode);
    if (!service.isEndpointsEnabled()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Service does not support endpoints");
    }
  }

  public List<TenantServiceSummary> listServices(String tenantId) {
    ensureTenant(tenantId);
    List<ServiceCatalog> catalog = serviceCatalogRepository.findAllByOrderByNameAsc();
    List<SubscriptionService> subscriptionServices = getSubscriptionServices(tenantId);
    Map<String, SubscriptionService> subscriptionMap =
        subscriptionServices.stream()
            .collect(Collectors.toMap(SubscriptionService::getServiceCode, item -> item, (a, b) -> a));
    List<TenantServiceConfig> configs = configRepository.findByTenantId(tenantId);
    Map<String, TenantServiceConfig> configMap =
        configs.stream()
            .collect(Collectors.toMap(TenantServiceConfig::getServiceCode, item -> item, (a, b) -> a));

    List<TenantServiceSummary> results = new ArrayList<>();
    for (ServiceCatalog service : catalog) {
      SubscriptionService subscription = subscriptionMap.get(service.getCode());
      TenantServiceConfig config = configMap.get(service.getCode());
      if (subscription != null && config == null) {
        config = ensureConfig(tenantId, service.getCode());
      }
      long userCount = serviceUserRepository.countByTenantIdAndServiceCode(tenantId, service.getCode());
      long endpointCount = endpointRepository.countByTenantIdAndServiceCode(tenantId, service.getCode());

      TenantServiceSummary summary = new TenantServiceSummary();
      summary.serviceCode = service.getCode();
      summary.name = service.getName();
      summary.description = service.getDescription();
      summary.apiBaseUrl =
          config != null && config.getApiBaseUrl() != null
              ? config.getApiBaseUrl()
              : service.getApiBaseUrl();
      summary.priceMonthlyEur = service.getPriceMonthlyEur();
      summary.priceAnnualEur = service.getPriceAnnualEur();
      summary.endpointsEnabled = service.isEndpointsEnabled();
      summary.subscriptionStatus = subscription != null ? subscription.getStatus() : "disabled";
      summary.activateAt = subscription != null ? subscription.getActivateAt() : null;
      summary.deactivateAt = subscription != null ? subscription.getDeactivateAt() : null;
      summary.configStatus = config != null ? config.getStatus() : DEFAULT_STATUS;
      summary.systemPrompt = config != null ? config.getSystemPrompt() : null;
      summary.providerId = config != null ? config.getProviderId() : null;
      summary.pricingId = config != null ? config.getPricingId() : null;
      summary.policyId = config != null ? config.getPolicyId() : null;
      summary.userCount = userCount;
      summary.endpointCount = endpointCount;
      results.add(summary);
    }
    return results;
  }

  public TenantServiceConfig updateConfig(
      String tenantId,
      String serviceCode,
      String status,
      String systemPrompt,
      String apiBaseUrl,
      String providerId,
      String pricingId,
      String policyId) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    TenantServiceConfig config = ensureConfig(tenantId, normalized);
    if (status != null && !status.isBlank()) {
      config.setStatus(status);
    }
    if (systemPrompt != null) {
      String trimmed = systemPrompt.trim();
      config.setSystemPrompt(trimmed.isEmpty() ? null : trimmed);
    }
    if (apiBaseUrl != null) {
      String trimmed = apiBaseUrl.trim();
      config.setApiBaseUrl(trimmed.isEmpty() ? null : trimmed);
    }
    if (providerId != null) {
      String trimmed = providerId.trim();
      config.setProviderId(trimmed.isEmpty() ? null : trimmed);
    }
    if (pricingId != null) {
      String trimmed = pricingId.trim();
      config.setPricingId(trimmed.isEmpty() ? null : trimmed);
    }
    if (policyId != null) {
      String trimmed = policyId.trim();
      config.setPolicyId(trimmed.isEmpty() ? null : trimmed);
    }
    config.setUpdatedAt(LocalDateTime.now());
    return configRepository.save(config);
  }

  public List<TenantServiceEndpointResponse> listEndpoints(String tenantId, String serviceCode) {
    ensureTenant(tenantId);
    List<TenantServiceEndpoint> endpoints =
        endpointRepository.findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
            tenantId, normalizeServiceCode(serviceCode));
    return endpoints.stream().map(this::toEndpointResponse).toList();
  }

  public TenantServiceEndpointResponse createEndpoint(
      String tenantId, String serviceCode, CreateEndpointRequest payload) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    requireEndpointsEnabled(normalized);
    ensureConfig(tenantId, normalized);

    TenantServiceEndpoint created = new TenantServiceEndpoint();
    created.setId(UUID.randomUUID().toString());
    created.setTenantId(tenantId);
    created.setServiceCode(normalized);
    created.setSlug(payload.slug.trim());
    created.setMethod(payload.method.trim().toUpperCase());
    created.setPath(payload.path.trim());
    created.setBaseUrl(payload.baseUrl != null ? payload.baseUrl.trim() : null);
    created.setHeaders(payload.headers != null ? toJson(payload.headers) : null);
    created.setEnabled(payload.enabled == null || payload.enabled);
    created.setCreatedAt(LocalDateTime.now());
    created.setUpdatedAt(LocalDateTime.now());
    TenantServiceEndpoint saved = endpointRepository.save(created);
    return toEndpointResponse(saved);
  }

  public TenantServiceEndpointResponse updateEndpoint(
      String tenantId, String serviceCode, String id, UpdateEndpointRequest payload) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    requireEndpointsEnabled(normalized);
    TenantServiceEndpoint endpoint =
        endpointRepository
            .findByIdAndTenantIdAndServiceCode(id, tenantId, normalized)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Endpoint not found"));

    if (payload.slug != null) {
      endpoint.setSlug(payload.slug.trim());
    }
    if (payload.method != null) {
      endpoint.setMethod(payload.method.trim().toUpperCase());
    }
    if (payload.path != null) {
      endpoint.setPath(payload.path.trim());
    }
    if (payload.baseUrl != null) {
      endpoint.setBaseUrl(payload.baseUrl.trim());
    }
    if (payload.baseUrl == null && payload.baseUrlSet) {
      endpoint.setBaseUrl(null);
    }
    if (payload.headers != null) {
      endpoint.setHeaders(toJson(payload.headers));
    }
    if (payload.headers == null && payload.headersSet) {
      endpoint.setHeaders(null);
    }
    if (payload.enabled != null) {
      endpoint.setEnabled(payload.enabled);
    }
    endpoint.setUpdatedAt(LocalDateTime.now());
    return toEndpointResponse(endpointRepository.save(endpoint));
  }

  public Map<String, Object> deleteEndpoint(String tenantId, String serviceCode, String id) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    TenantServiceEndpoint endpoint =
        endpointRepository
            .findByIdAndTenantIdAndServiceCode(id, tenantId, normalized)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Endpoint not found"));
    endpointRepository.deleteById(endpoint.getId());
    return Map.of("deleted", true);
  }

  public List<TenantServiceUserView> listServiceUsers(String tenantId, String serviceCode) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    List<TenantServiceUser> assignments =
        serviceUserRepository.findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized);
    if (assignments.isEmpty()) {
      return List.of();
    }
    List<String> userIds = assignments.stream().map(TenantServiceUser::getUserId).toList();
    List<ChatUser> users = chatUsersRepository.findByTenantIdAndIdIn(tenantId, userIds);
    Map<String, ChatUser> userMap =
        users.stream().collect(Collectors.toMap(ChatUser::getId, item -> item, (a, b) -> a));

    return assignments.stream()
        .map(
            assignment -> {
              ChatUser user = userMap.get(assignment.getUserId());
              if (user == null) {
                return null;
              }
              TenantServiceUserView view = new TenantServiceUserView();
              view.userId = assignment.getUserId();
              view.status = assignment.getStatus();
              view.user = new ChatUserSummary(user);
              return view;
            })
        .filter(item -> item != null)
        .toList();
  }

  public TenantServiceUser assignUser(
      String tenantId, String serviceCode, String userId, String status) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    ChatUser user =
        chatUsersRepository
            .findByIdAndTenantId(userId, tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    ensureConfig(tenantId, normalized);

    Optional<TenantServiceUser> existing =
        serviceUserRepository.findByTenantIdAndServiceCodeAndUserId(tenantId, normalized, userId);
    TenantServiceUser assignment = existing.orElseGet(TenantServiceUser::new);
    if (assignment.getId() == null) {
      assignment.setId(UUID.randomUUID().toString());
      assignment.setTenantId(tenantId);
      assignment.setServiceCode(normalized);
      assignment.setUserId(userId);
      assignment.setCreatedAt(LocalDateTime.now());
    }
    if (status != null && !status.isBlank()) {
      assignment.setStatus(status);
    } else if (assignment.getStatus() == null) {
      assignment.setStatus("active");
    }
    assignment.setUpdatedAt(LocalDateTime.now());
    return serviceUserRepository.save(assignment);
  }

  public TenantServiceUser updateServiceUser(
      String tenantId, String serviceCode, String userId, String status) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    TenantServiceUser assignment =
        serviceUserRepository
            .findByTenantIdAndServiceCodeAndUserId(tenantId, normalized, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User assignment not found"));
    assignment.setStatus(status);
    assignment.setUpdatedAt(LocalDateTime.now());
    return serviceUserRepository.save(assignment);
  }

  public Map<String, Object> removeServiceUser(String tenantId, String serviceCode, String userId) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    serviceUserRepository.deleteByTenantIdAndServiceCodeAndUserId(tenantId, normalized, userId);
    return Map.of("deleted", true);
  }

  public void removeUserFromAllServices(String tenantId, String userId) {
    serviceUserRepository.deleteByTenantIdAndUserId(tenantId, userId);
  }

  public List<TenantServiceUserService> listServicesForUser(String tenantId, String userId) {
    ensureTenant(tenantId);
    List<TenantServiceUser> assignments = serviceUserRepository.findByTenantIdAndUserId(tenantId, userId);
    if (assignments.isEmpty()) {
      return List.of();
    }
    List<String> codes = assignments.stream().map(TenantServiceUser::getServiceCode).toList();
    List<ServiceCatalog> catalog = serviceCatalogRepository.findAll().stream()
        .filter(item -> codes.contains(item.getCode()))
        .toList();
    Map<String, ServiceCatalog> catalogMap =
        catalog.stream().collect(Collectors.toMap(ServiceCatalog::getCode, item -> item, (a, b) -> a));
    List<TenantServiceConfig> configs = configRepository.findByTenantIdAndServiceCodeIn(tenantId, codes);
    Map<String, TenantServiceConfig> configMap =
        configs.stream().collect(Collectors.toMap(TenantServiceConfig::getServiceCode, item -> item, (a, b) -> a));
    List<SubscriptionService> subscriptionServices = getSubscriptionServices(tenantId);
    Map<String, SubscriptionService> subscriptionMap =
        subscriptionServices.stream().collect(Collectors.toMap(SubscriptionService::getServiceCode, item -> item, (a, b) -> a));

    return assignments.stream()
        .map(
            assignment -> {
              ServiceCatalog catalogItem = catalogMap.get(assignment.getServiceCode());
              TenantServiceConfig config = configMap.get(assignment.getServiceCode());
              SubscriptionService subscription = subscriptionMap.get(assignment.getServiceCode());
              String subscriptionStatus = subscription != null ? subscription.getStatus() : "disabled";
              String operationalStatus =
                  "suspended".equals(assignment.getStatus()) ||
                          (config != null && "suspended".equals(config.getStatus()))
                      ? "suspended"
                      : "active";
              TenantServiceUserService view = new TenantServiceUserService();
              view.serviceCode = assignment.getServiceCode();
              view.name = catalogItem != null ? catalogItem.getName() : assignment.getServiceCode();
              view.description = catalogItem != null ? catalogItem.getDescription() : "";
              view.subscriptionStatus = subscriptionStatus;
              view.activateAt = subscription != null ? subscription.getActivateAt() : null;
              view.deactivateAt = subscription != null ? subscription.getDeactivateAt() : null;
              view.status = operationalStatus;
              return view;
            })
        .toList();
  }

  public ServiceAccess requireServiceAccess(String tenantId, String serviceCode, String userId) {
    ensureTenant(tenantId);
    String normalized = normalizeServiceCode(serviceCode);
    List<SubscriptionService> subscriptionServices = getSubscriptionServices(tenantId);
    SubscriptionService subscription =
        subscriptionServices.stream()
            .filter(item -> normalized.equals(item.getServiceCode()))
            .findFirst()
            .orElse(null);
    if (subscription == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service not subscribed");
    }
    if ("pending".equals(subscription.getStatus())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service pending activation");
    }

    TenantServiceConfig config = ensureConfig(tenantId, normalized);
    if ("suspended".equals(config.getStatus())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service is suspended");
    }

    TenantServiceUser assignment =
        serviceUserRepository
            .findByTenantIdAndServiceCodeAndUserId(tenantId, normalized, userId)
            .orElse(null);
    if (assignment == null || !"active".equals(assignment.getStatus())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not allowed for this service");
    }

    ServiceAccess access = new ServiceAccess();
    access.config = config;
    access.subscription = subscription;
    return access;
  }

  private TenantServiceEndpointResponse toEndpointResponse(TenantServiceEndpoint endpoint) {
    TenantServiceEndpointResponse response = new TenantServiceEndpointResponse();
    response.id = endpoint.getId();
    response.tenantId = endpoint.getTenantId();
    response.serviceCode = endpoint.getServiceCode();
    response.slug = endpoint.getSlug();
    response.method = endpoint.getMethod();
    response.path = endpoint.getPath();
    response.baseUrl = endpoint.getBaseUrl();
    response.enabled = endpoint.isEnabled();
    response.createdAt = endpoint.getCreatedAt();
    response.updatedAt = endpoint.getUpdatedAt();
    response.headers = parseJson(endpoint.getHeaders());
    return response;
  }

  private Map<String, String> parseJson(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readValue(value, Map.class);
    } catch (Exception ex) {
      return null;
    }
  }

  private String toJson(Map<String, String> value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid headers JSON");
    }
  }

  public static class TenantServiceSummary {
    public String serviceCode;
    public String name;
    public String description;
    public String apiBaseUrl;
    public java.math.BigDecimal priceMonthlyEur;
    public java.math.BigDecimal priceAnnualEur;
    public boolean endpointsEnabled;
    public String subscriptionStatus;
    public LocalDateTime activateAt;
    public LocalDateTime deactivateAt;
    public String configStatus;
    public String systemPrompt;
    public String providerId;
    public String pricingId;
    public String policyId;
    public long userCount;
    public long endpointCount;
  }

  public static class TenantServiceEndpointResponse {
    public String id;
    public String tenantId;
    public String serviceCode;
    public String slug;
    public String method;
    public String path;
    public String baseUrl;
    public Map<String, String> headers;
    public boolean enabled;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
  }

  public static class TenantServiceUserView {
    public String userId;
    public String status;
    public ChatUserSummary user;
  }

  public static class ChatUserSummary {
    public String id;
    public String tenantId;
    public String email;
    public String name;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public ChatUserSummary(ChatUser user) {
      this.id = user.getId();
      this.tenantId = user.getTenantId();
      this.email = user.getEmail();
      this.name = user.getName();
      this.status = user.getStatus();
      this.createdAt = user.getCreatedAt();
      this.updatedAt = user.getUpdatedAt();
    }
  }

  public static class TenantServiceUserService {
    public String serviceCode;
    public String name;
    public String description;
    public String subscriptionStatus;
    public LocalDateTime activateAt;
    public LocalDateTime deactivateAt;
    public String status;
  }

  public static class ServiceAccess {
    public TenantServiceConfig config;
    public SubscriptionService subscription;
  }

  public static class CreateEndpointRequest {
    public String slug;
    public String method;
    public String path;
    public String baseUrl;
    public Map<String, String> headers;
    public Boolean enabled;
  }

  public static class UpdateEndpointRequest {
    public String slug;
    public String method;
    public String path;
    public String baseUrl;
    public boolean baseUrlSet;
    public Map<String, String> headers;
    public boolean headersSet;
    public Boolean enabled;
  }
}
