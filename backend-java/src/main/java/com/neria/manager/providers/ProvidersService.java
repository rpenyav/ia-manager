package com.neria.manager.providers;

import com.neria.manager.common.entities.Provider;
import com.neria.manager.common.repos.ProviderRepository;
import com.neria.manager.common.services.EncryptionService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProvidersService {
  private final ProviderRepository repository;
  private final EncryptionService encryptionService;

  public ProvidersService(ProviderRepository repository, EncryptionService encryptionService) {
    this.repository = repository;
    this.encryptionService = encryptionService;
  }

  public List<Provider> list(String tenantId) {
    return repository.findByTenantId(tenantId);
  }

  public Provider create(String tenantId, CreateProviderRequest dto) {
    Provider provider = new Provider();
    provider.setId(UUID.randomUUID().toString());
    provider.setTenantId(tenantId);
    provider.setType(dto.type);
    provider.setDisplayName(dto.displayName);
    provider.setEncryptedCredentials(encryptionService.encrypt(dto.credentialsJson));
    provider.setConfig(dto.configJson);
    provider.setEnabled(dto.enabled != null ? dto.enabled : true);
    provider.setCreatedAt(LocalDateTime.now());
    provider.setUpdatedAt(LocalDateTime.now());
    return repository.save(provider);
  }

  public Provider update(String tenantId, String id, UpdateProviderRequest dto) {
    Provider provider = repository.findById(id).orElseThrow();
    if (!provider.getTenantId().equals(tenantId)) {
      throw new IllegalArgumentException("Provider tenant mismatch");
    }
    if (dto.displayName != null) {
      provider.setDisplayName(dto.displayName);
    }
    if (dto.enabled != null) {
      provider.setEnabled(dto.enabled);
    }
    if (dto.credentialsJson != null && !dto.credentialsJson.isBlank()) {
      provider.setEncryptedCredentials(encryptionService.encrypt(dto.credentialsJson));
    }
    if (dto.configJson != null && !dto.configJson.isBlank()) {
      provider.setConfig(dto.configJson);
    }
    provider.setUpdatedAt(LocalDateTime.now());
    return repository.save(provider);
  }

  public Provider getByTenantAndId(String tenantId, String id) {
    Provider provider = repository.findById(id).orElse(null);
    if (provider == null || !provider.getTenantId().equals(tenantId)) {
      return null;
    }
    return provider;
  }

  public String getDecryptedCredentials(Provider provider) {
    if (provider == null) {
      return "{}";
    }
    return encryptionService.decrypt(provider.getEncryptedCredentials());
  }

  public static class CreateProviderRequest {
    public String type;
    public String displayName;
    public String credentialsJson;
    public String configJson;
    public Boolean enabled;
  }

  public static class UpdateProviderRequest {
    public String displayName;
    public String credentialsJson;
    public String configJson;
    public Boolean enabled;
  }
}
