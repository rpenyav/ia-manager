package com.neria.manager.providers;

import com.neria.manager.common.entities.Provider;
import com.neria.manager.common.repos.ProviderRepository;
import com.neria.manager.common.services.EncryptionService;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProvidersService {
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
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
    String credentials = normalizeJson(dto.credentialsJson);
    if (credentials == null || credentials.isBlank()) {
      throw new IllegalArgumentException("Missing provider credentials");
    }
    String config = normalizeJson(dto.configJson);
    if (config == null || config.isBlank()) {
      config = "{}";
    }
    Provider provider = new Provider();
    provider.setId(UUID.randomUUID().toString());
    provider.setTenantId(tenantId);
    provider.setType(dto.type);
    provider.setDisplayName(dto.displayName);
    provider.setEncryptedCredentials(encryptionService.encrypt(credentials));
    provider.setConfig(config);
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
    String credentials = normalizeJson(dto.credentialsJson);
    if (credentials != null && !credentials.isBlank()) {
      provider.setEncryptedCredentials(encryptionService.encrypt(credentials));
    }
    String config = normalizeJson(dto.configJson);
    if (config != null && !config.isBlank()) {
      provider.setConfig(config);
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

  private String normalizeJson(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof String text) {
      return text;
    }
    try {
      return OBJECT_MAPPER.writeValueAsString(value);
    } catch (JsonProcessingException ex) {
      throw new IllegalArgumentException("Invalid JSON payload", ex);
    }
  }

  public static class CreateProviderRequest {
    public String type;
    public String displayName;
    @JsonAlias({"credentials", "credentialsJson"})
    public Object credentialsJson;
    @JsonAlias({"config", "configJson"})
    public Object configJson;
    public Boolean enabled;
  }

  public static class UpdateProviderRequest {
    public String displayName;
    @JsonAlias({"credentials", "credentialsJson"})
    public Object credentialsJson;
    @JsonAlias({"config", "configJson"})
    public Object configJson;
    public Boolean enabled;
  }
}
