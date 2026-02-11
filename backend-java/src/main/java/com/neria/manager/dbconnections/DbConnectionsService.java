package com.neria.manager.dbconnections;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.DbConnection;
import com.neria.manager.common.repos.DbConnectionRepository;
import com.neria.manager.common.services.EncryptionService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DbConnectionsService {
  private final DbConnectionRepository repository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  public DbConnectionsService(
      DbConnectionRepository repository,
      EncryptionService encryptionService,
      ObjectMapper objectMapper) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.objectMapper = objectMapper;
  }

  public List<DbConnection> list(String tenantId) {
    return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
  }

  public DbConnection create(String tenantId, CreateDbConnectionRequest dto) {
    DbConnection connection = new DbConnection();
    connection.setId(UUID.randomUUID().toString());
    connection.setTenantId(tenantId);
    connection.setName(dto.name);
    connection.setEngine(dto.engine != null ? dto.engine : "mysql");
    connection.setEncryptedConfig(encryptJson(dto.config));
    connection.setAllowedTables(toJson(dto.allowedTables != null ? dto.allowedTables : List.of()));
    connection.setReadOnly(dto.readOnly != null ? dto.readOnly : true);
    connection.setMetadata(toJson(dto.metadata != null ? dto.metadata : Map.of()));
    connection.setEnabled(dto.enabled != null ? dto.enabled : true);
    connection.setCreatedAt(LocalDateTime.now());
    connection.setUpdatedAt(LocalDateTime.now());
    return repository.save(connection);
  }

  public DbConnection update(String tenantId, String id, UpdateDbConnectionRequest dto) {
    DbConnection connection =
        repository
            .findByIdAndTenantId(id, tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DB connection not found"));

    if (dto.name != null) {
      connection.setName(dto.name);
    }
    if (dto.engine != null) {
      connection.setEngine(dto.engine);
    }
    if (dto.config != null) {
      connection.setEncryptedConfig(encryptJson(dto.config));
    }
    if (dto.allowedTables != null) {
      connection.setAllowedTables(toJson(dto.allowedTables));
    }
    if (dto.readOnly != null) {
      connection.setReadOnly(dto.readOnly);
    }
    if (dto.metadata != null) {
      connection.setMetadata(toJson(dto.metadata));
    }
    if (dto.enabled != null) {
      connection.setEnabled(dto.enabled);
    }
    connection.setUpdatedAt(LocalDateTime.now());
    return repository.save(connection);
  }

  public DbConnection getById(String tenantId, String id) {
    return repository
        .findByIdAndTenantId(id, tenantId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DB connection not found"));
  }

  public Map<String, Object> getDecryptedConfig(DbConnection connection) {
    String raw = encryptionService.decrypt(connection.getEncryptedConfig());
    try {
      return objectMapper.readValue(raw, Map.class);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid DB config JSON");
    }
  }

  public List<String> getAllowedTables(DbConnection connection) {
    String raw = connection.getAllowedTables();
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(raw, List.class);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid allowed tables JSON");
    }
  }

  private String encryptJson(Map<String, Object> payload) {
    return encryptionService.encrypt(toJson(payload));
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
    }
  }

  public static class CreateDbConnectionRequest {
    public String name;
    public String engine;
    public Map<String, Object> config;
    public List<String> allowedTables;
    public Boolean readOnly;
    public Map<String, Object> metadata;
    public Boolean enabled;
  }

  public static class UpdateDbConnectionRequest {
    public String name;
    public String engine;
    public Map<String, Object> config;
    public List<String> allowedTables;
    public Boolean readOnly;
    public Map<String, Object> metadata;
    public Boolean enabled;
  }
}
