package com.neria.manager.common.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.SystemSetting;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.repos.SystemSettingRepository;
import com.neria.manager.common.repos.TenantRepository;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class KillSwitchService {
  private static class CacheEntry {
    final boolean value;
    final long timestamp;

    CacheEntry(boolean value, long timestamp) {
      this.value = value;
      this.timestamp = timestamp;
    }
  }

  private final TenantRepository tenantRepository;
  private final SystemSettingRepository settingsRepository;
  private final ObjectMapper objectMapper;
  private final long ttlSeconds;
  private final ConcurrentHashMap<String, CacheEntry> tenantCache = new ConcurrentHashMap<>();
  private CacheEntry globalCache;

  public KillSwitchService(
      TenantRepository tenantRepository,
      SystemSettingRepository settingsRepository,
      ObjectMapper objectMapper) {
    this.tenantRepository = tenantRepository;
    this.settingsRepository = settingsRepository;
    this.objectMapper = objectMapper;
    this.ttlSeconds = Long.parseLong(System.getenv().getOrDefault("KILL_SWITCH_CACHE_TTL", "30"));
  }

  public boolean getTenantKillSwitch(String tenantId) {
    CacheEntry cached = tenantCache.get(tenantId);
    if (cached != null && !isExpired(cached)) {
      return cached.value;
    }
    boolean enabled =
        tenantRepository
            .findById(tenantId)
            .map(Tenant::isKillSwitch)
            .orElse(false);
    tenantCache.put(tenantId, new CacheEntry(enabled, now()));
    return enabled;
  }

  public void setTenantKillSwitch(String tenantId, boolean enabled) {
    tenantCache.put(tenantId, new CacheEntry(enabled, now()));
  }

  public boolean getGlobalKillSwitch() {
    if (globalCache != null && !isExpired(globalCache)) {
      return globalCache.value;
    }
    boolean fallback = "true".equalsIgnoreCase(System.getenv().getOrDefault("KILL_SWITCH_DEFAULT", "false"));
    boolean enabled = fallback;
    SystemSetting setting = settingsRepository.findById("global_kill_switch").orElse(null);
    if (setting != null && setting.getValue() != null) {
      try {
        Map<String, Object> parsed = objectMapper.readValue(setting.getValue(), Map.class);
        Object raw = parsed.get("enabled");
        if (raw instanceof Boolean) {
          enabled = (Boolean) raw;
        }
      } catch (Exception ignore) {
        // keep fallback
      }
    }
    globalCache = new CacheEntry(enabled, now());
    return enabled;
  }

  public void setGlobalKillSwitch(boolean enabled) {
    SystemSetting setting = new SystemSetting();
    setting.setKey("global_kill_switch");
    try {
      setting.setValue(objectMapper.writeValueAsString(Map.of("enabled", enabled)));
    } catch (Exception ex) {
      setting.setValue("{\"enabled\":false}");
    }
    settingsRepository.save(setting);
    globalCache = new CacheEntry(enabled, now());
  }

  private boolean isExpired(CacheEntry entry) {
    return (now() - entry.timestamp) > (ttlSeconds * 1000L);
  }

  private long now() {
    return Instant.now().toEpochMilli();
  }
}
