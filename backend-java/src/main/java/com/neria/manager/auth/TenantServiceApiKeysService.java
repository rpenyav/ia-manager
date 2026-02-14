package com.neria.manager.auth;

import com.neria.manager.common.entities.TenantServiceApiKey;
import com.neria.manager.common.repos.TenantServiceApiKeyRepository;
import com.neria.manager.common.services.EncryptionService;
import com.neria.manager.common.services.ScryptHasher;
import com.neria.manager.config.AppProperties;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TenantServiceApiKeysService {
  private final TenantServiceApiKeyRepository repository;
  private final ScryptHasher hasher;
  private final EncryptionService encryptionService;
  private final String salt;

  public TenantServiceApiKeysService(
      TenantServiceApiKeyRepository repository,
      ScryptHasher hasher,
      EncryptionService encryptionService,
      AppProperties properties) {
    this.repository = repository;
    this.hasher = hasher;
    this.encryptionService = encryptionService;
    this.salt =
        Optional.ofNullable(properties.getSecurity().getApiKeySalt()).orElse("");
    if (this.salt.length() < 16) {
      throw new IllegalStateException("API_KEY_SALT must be at least 16 characters");
    }
  }

  public TenantServiceApiKey getOrCreate(String tenantId, String serviceCode) {
    return repository
        .findByTenantIdAndServiceCode(tenantId, serviceCode)
        .orElseGet(() -> create(tenantId, serviceCode));
  }

  public List<TenantServiceApiKey> ensureKeys(String tenantId, List<String> serviceCodes) {
    if (serviceCodes == null || serviceCodes.isEmpty()) {
      return List.of();
    }
    Map<String, TenantServiceApiKey> existing =
        repository.findByTenantIdAndServiceCodeIn(tenantId, serviceCodes).stream()
            .collect(Collectors.toMap(TenantServiceApiKey::getServiceCode, item -> item));
    return serviceCodes.stream()
        .map(code -> existing.getOrDefault(code, create(tenantId, code)))
        .toList();
  }

  public TenantServiceApiKey create(String tenantId, String serviceCode) {
    String plain = generateKey();
    TenantServiceApiKey record = new TenantServiceApiKey();
    record.setId(UUID.randomUUID().toString());
    record.setTenantId(tenantId);
    record.setServiceCode(serviceCode);
    record.setHashedKey(hasher.hash(plain, salt));
    record.setEncryptedKey(encryptionService.encrypt(plain));
    record.setStatus("active");
    record.setCreatedAt(LocalDateTime.now());
    return repository.save(record);
  }

  public TenantServiceApiKey validate(String apiKey) {
    String hashed = hasher.hash(apiKey, salt);
    return repository.findByHashedKeyAndStatus(hashed, "active").orElse(null);
  }

  public String decryptKey(TenantServiceApiKey record) {
    if (record == null) {
      return null;
    }
    return encryptionService.decrypt(record.getEncryptedKey());
  }

  public Map<String, String> listPlainKeysByTenant(String tenantId) {
    return repository.findByTenantId(tenantId).stream()
        .collect(
            Collectors.toMap(
                TenantServiceApiKey::getServiceCode,
                item -> encryptionService.decrypt(item.getEncryptedKey()),
                (a, b) -> a));
  }

  public void deleteByTenantAndServiceCode(String tenantId, String serviceCode) {
    if (tenantId == null || serviceCode == null) {
      return;
    }
    repository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
  }

  private String generateKey() {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }
}
