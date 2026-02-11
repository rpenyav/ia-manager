package com.neria.manager.auth;

import com.neria.manager.common.entities.ApiKey;
import com.neria.manager.common.repos.ApiKeyRepository;
import com.neria.manager.common.services.ScryptHasher;
import com.neria.manager.config.AppProperties;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ApiKeysService {
  private final ApiKeyRepository apiKeyRepository;
  private final ScryptHasher hasher;
  private final String salt;

  public ApiKeysService(
      ApiKeyRepository apiKeyRepository, ScryptHasher hasher, AppProperties properties) {
    this.apiKeyRepository = apiKeyRepository;
    this.hasher = hasher;
    this.salt = Optional.ofNullable(properties.getSecurity().getApiKeySalt()).orElse("");
    if (this.salt.length() < 16) {
      throw new IllegalStateException("API_KEY_SALT must be at least 16 characters");
    }
  }

  public ApiKeyCreateResult create(String name, String tenantId) {
    String plainKey = generateKey();
    ApiKey record = new ApiKey();
    record.setId(UUID.randomUUID().toString());
    record.setName(name);
    record.setTenantId(tenantId);
    record.setHashedKey(hasher.hash(plainKey, salt));
    record.setStatus("active");
    record.setCreatedAt(LocalDateTime.now());
    apiKeyRepository.save(record);
    return new ApiKeyCreateResult(record.getId(), record.getName(), record.getTenantId(), plainKey);
  }

  public List<ApiKey> list(String tenantId) {
    if (tenantId != null && !tenantId.isBlank()) {
      return apiKeyRepository.findByTenantId(tenantId);
    }
    return apiKeyRepository.findAll();
  }

  public ApiKey revoke(String id) {
    ApiKey record = apiKeyRepository.findById(id).orElse(null);
    if (record == null) {
      return null;
    }
    record.setStatus("revoked");
    return apiKeyRepository.save(record);
  }

  public ApiKeyCreateResult rotate(String id) {
    ApiKey record = apiKeyRepository.findById(id).orElse(null);
    if (record == null) {
      return null;
    }
    String plainKey = generateKey();
    record.setHashedKey(hasher.hash(plainKey, salt));
    record.setStatus("active");
    apiKeyRepository.save(record);
    return new ApiKeyCreateResult(record.getId(), record.getName(), record.getTenantId(), plainKey);
  }

  public ApiKey validate(String apiKey) {
    String hashed = hasher.hash(apiKey, salt);
    return apiKeyRepository.findByHashedKeyAndStatus(hashed, "active").orElse(null);
  }

  private String generateKey() {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  public record ApiKeyCreateResult(String id, String name, String tenantId, String apiKey) {}
}
