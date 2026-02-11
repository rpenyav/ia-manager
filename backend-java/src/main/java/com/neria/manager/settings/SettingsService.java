package com.neria.manager.settings;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ApiKey;
import com.neria.manager.common.entities.Policy;
import com.neria.manager.common.entities.Provider;
import com.neria.manager.common.entities.SystemSetting;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.entities.TenantPricing;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceEndpoint;
import com.neria.manager.common.entities.TenantServiceUser;
import com.neria.manager.common.repos.ApiKeyRepository;
import com.neria.manager.common.repos.PolicyRepository;
import com.neria.manager.common.repos.ProviderRepository;
import com.neria.manager.common.repos.SystemSettingRepository;
import com.neria.manager.common.repos.TenantPricingRepository;
import com.neria.manager.common.repos.TenantRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEndpointRepository;
import com.neria.manager.common.repos.TenantServiceUserRepository;
import com.neria.manager.common.services.KillSwitchService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SettingsService {
  private final KillSwitchService killSwitchService;
  private final SystemSettingRepository settingsRepository;
  private final TenantRepository tenantsRepository;
  private final ProviderRepository providersRepository;
  private final PolicyRepository policiesRepository;
  private final ApiKeyRepository apiKeysRepository;
  private final TenantPricingRepository tenantPricingRepository;
  private final TenantServiceConfigRepository tenantServiceConfigRepository;
  private final TenantServiceEndpointRepository tenantServiceEndpointRepository;
  private final TenantServiceUserRepository tenantServiceUserRepository;
  private final ObjectMapper objectMapper;

  public SettingsService(
      KillSwitchService killSwitchService,
      SystemSettingRepository settingsRepository,
      TenantRepository tenantsRepository,
      ProviderRepository providersRepository,
      PolicyRepository policiesRepository,
      ApiKeyRepository apiKeysRepository,
      TenantPricingRepository tenantPricingRepository,
      TenantServiceConfigRepository tenantServiceConfigRepository,
      TenantServiceEndpointRepository tenantServiceEndpointRepository,
      TenantServiceUserRepository tenantServiceUserRepository,
      ObjectMapper objectMapper) {
    this.killSwitchService = killSwitchService;
    this.settingsRepository = settingsRepository;
    this.tenantsRepository = tenantsRepository;
    this.providersRepository = providersRepository;
    this.policiesRepository = policiesRepository;
    this.apiKeysRepository = apiKeysRepository;
    this.tenantPricingRepository = tenantPricingRepository;
    this.tenantServiceConfigRepository = tenantServiceConfigRepository;
    this.tenantServiceEndpointRepository = tenantServiceEndpointRepository;
    this.tenantServiceUserRepository = tenantServiceUserRepository;
    this.objectMapper = objectMapper;
  }

  public Map<String, Object> getGlobalKillSwitch() {
    return Map.of("enabled", killSwitchService.getGlobalKillSwitch());
  }

  public Map<String, Object> setGlobalKillSwitch(boolean enabled) {
    killSwitchService.setGlobalKillSwitch(enabled);
    return Map.of("enabled", enabled);
  }

  public Map<String, Object> getAlertsSchedule() {
    SystemSetting setting = settingsRepository.findById("alerts_schedule").orElse(null);
    String defaultCron = System.getenv().getOrDefault("ALERTS_CRON", "*/5 * * * *");
    int defaultInterval = Integer.parseInt(System.getenv().getOrDefault("ALERTS_MIN_INTERVAL_MINUTES", "15"));
    if (setting == null || setting.getValue() == null) {
      return Map.of("cron", defaultCron, "minIntervalMinutes", defaultInterval);
    }
    try {
      Map<String, Object> parsed = objectMapper.readValue(setting.getValue(), Map.class);
      String cron = String.valueOf(parsed.getOrDefault("cron", defaultCron));
      int interval = Integer.parseInt(String.valueOf(parsed.getOrDefault("minIntervalMinutes", defaultInterval)));
      return Map.of("cron", cron, "minIntervalMinutes", interval);
    } catch (Exception ex) {
      return Map.of("cron", defaultCron, "minIntervalMinutes", defaultInterval);
    }
  }

  public Map<String, Object> setAlertsSchedule(String cron, int minIntervalMinutes) {
    SystemSetting setting = new SystemSetting();
    setting.setKey("alerts_schedule");
    setting.setValue(toJson(Map.of("cron", cron, "minIntervalMinutes", minIntervalMinutes)));
    settingsRepository.save(setting);
    return getAlertsSchedule();
  }

  public Map<String, Object> getDebugMode() {
    SystemSetting setting = settingsRepository.findById("debug_mode").orElse(null);
    boolean enabled = false;
    if (setting != null && setting.getValue() != null) {
      try {
        Map<String, Object> parsed = objectMapper.readValue(setting.getValue(), Map.class);
        Object raw = parsed.get("enabled");
        if (raw instanceof Boolean) {
          enabled = (Boolean) raw;
        }
      } catch (Exception ignore) {
      }
    }
    return Map.of("enabled", enabled);
  }

  public Map<String, Object> setDebugMode(boolean enabled) {
    SystemSetting setting = new SystemSetting();
    setting.setKey("debug_mode");
    setting.setValue(toJson(Map.of("enabled", enabled)));
    settingsRepository.save(setting);
    return Map.of("enabled", enabled);
  }

  public Map<String, Object> purgeResources(List<String> resources) {
    boolean enabled = (boolean) getDebugMode().getOrDefault("enabled", false);
    if (!enabled) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debug mode disabled");
    }

    List<String> targets = (resources == null || resources.isEmpty())
        ? List.of("providers", "tenants", "policies", "api_keys")
        : resources;

    java.util.Map<String, Integer> summary = new java.util.HashMap<>();

    if (targets.contains("providers")) {
      summary.put("providers", (int) providersRepository.count());
      providersRepository.deleteAll();
    }
    if (targets.contains("policies")) {
      summary.put("policies", (int) policiesRepository.count());
      policiesRepository.deleteAll();
    }
    if (targets.contains("api_keys")) {
      summary.put("api_keys", (int) apiKeysRepository.count());
      apiKeysRepository.deleteAll();
    }
    if (targets.contains("tenants")) {
      summary.put("tenant_service_users", (int) tenantServiceUserRepository.count());
      summary.put("tenant_service_endpoints", (int) tenantServiceEndpointRepository.count());
      summary.put("tenant_service_configs", (int) tenantServiceConfigRepository.count());
      summary.put("tenant_pricings", (int) tenantPricingRepository.count());
      summary.put("tenants", (int) tenantsRepository.count());
      tenantServiceUserRepository.deleteAll();
      tenantServiceEndpointRepository.deleteAll();
      tenantServiceConfigRepository.deleteAll();
      tenantPricingRepository.deleteAll();
      tenantsRepository.deleteAll();
    }

    return Map.of("cleared", summary);
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
    }
  }
}
