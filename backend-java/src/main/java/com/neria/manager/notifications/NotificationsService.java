package com.neria.manager.notifications;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.NotificationChannel;
import com.neria.manager.common.repos.NotificationChannelRepository;
import com.neria.manager.common.services.EmailService;
import com.neria.manager.common.services.EncryptionService;
import com.neria.manager.usage.UsageAlertsService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationsService {
  private final NotificationChannelRepository repository;
  private final EncryptionService encryptionService;
  private final EmailService emailService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newHttpClient();

  public NotificationsService(
      NotificationChannelRepository repository,
      EncryptionService encryptionService,
      EmailService emailService,
      ObjectMapper objectMapper) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.emailService = emailService;
    this.objectMapper = objectMapper;
  }

  public List<Map<String, Object>> list() {
    return repository.findAllByOrderByCreatedAtDesc().stream().map(this::sanitize).toList();
  }

  public Map<String, Object> create(CreateChannelRequest dto) {
    NotificationChannel channel = new NotificationChannel();
    channel.setId(UUID.randomUUID().toString());
    channel.setTenantId(dto.tenantId);
    channel.setType(dto.type);
    channel.setEnabled(dto.enabled != null ? dto.enabled : true);
    channel.setEncryptedSecret(
        dto.webhookUrl != null && !dto.webhookUrl.isBlank()
            ? encryptionService.encrypt(dto.webhookUrl)
            : null);
    channel.setConfig(
        toJson(
            Map.of(
                "name",
                dto.name != null ? dto.name : dto.type.toUpperCase(),
                "recipients",
                dto.recipients != null ? dto.recipients : List.of())));
    channel.setCreatedAt(LocalDateTime.now());
    channel.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(channel));
  }

  public Map<String, Object> update(String id, UpdateChannelRequest dto) {
    NotificationChannel channel =
        repository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Notification channel not found"));
    if (dto.tenantId != null) {
      channel.setTenantId(dto.tenantId);
    }
    if (dto.type != null) {
      channel.setType(dto.type);
    }
    if (dto.enabled != null) {
      channel.setEnabled(dto.enabled);
    }
    Map<String, Object> config = parseConfig(channel.getConfig());
    if (dto.name != null) {
      config.put("name", dto.name);
    }
    if (dto.recipients != null) {
      config.put("recipients", dto.recipients);
    }
    channel.setConfig(toJson(config));
    if (dto.webhookUrl != null) {
      channel.setEncryptedSecret(
          dto.webhookUrl.isBlank() ? null : encryptionService.encrypt(dto.webhookUrl));
    }
    channel.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(channel));
  }

  public Map<String, Object> sendAlerts(
      String tenantId, List<UsageAlertsService.UsageAlert> alerts) {
    if (alerts.isEmpty()) {
      return Map.of("sent", 0);
    }
    List<NotificationChannel> channels =
        repository.findByTenantIdOrTenantIdIsNull(tenantId);
    List<NotificationChannel> enabled =
        channels.stream().filter(NotificationChannel::isEnabled).toList();

    String message = buildMessage(tenantId, alerts);
    int sent = 0;
    for (NotificationChannel channel : enabled) {
      if ("email".equalsIgnoreCase(channel.getType())) {
        List<String> recipients =
            (List<String>) parseConfig(channel.getConfig()).getOrDefault("recipients", List.of());
        if (!recipients.isEmpty()) {
          emailService.sendGeneric(recipients, "Alertas Provider Manager IA", message);
          sent += 1;
        }
      } else if ("slack".equalsIgnoreCase(channel.getType())) {
        String webhookUrl =
            channel.getEncryptedSecret() != null
                ? encryptionService.decrypt(channel.getEncryptedSecret())
                : null;
        if (webhookUrl != null && !webhookUrl.isBlank()) {
          if (sendSlack(webhookUrl, message)) {
            sent += 1;
          }
        }
      }
    }
    return Map.of("sent", sent);
  }

  private boolean sendSlack(String webhookUrl, String message) {
    try {
      String payload = toJson(Map.of("text", message));
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(webhookUrl))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(payload))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      return response.statusCode() >= 200 && response.statusCode() < 300;
    } catch (Exception ex) {
      return false;
    }
  }

  private Map<String, Object> sanitize(NotificationChannel channel) {
    return Map.of(
        "id",
        channel.getId(),
        "tenantId",
        channel.getTenantId(),
        "type",
        channel.getType(),
        "config",
        parseConfig(channel.getConfig()),
        "enabled",
        channel.isEnabled(),
        "createdAt",
        channel.getCreatedAt(),
        "updatedAt",
        channel.getUpdatedAt());
  }

  private String buildMessage(String tenantId, List<UsageAlertsService.UsageAlert> alerts) {
    List<String> lines = new ArrayList<>();
    for (UsageAlertsService.UsageAlert alert : alerts) {
      String value =
          alert.value() != null && alert.limit() != null
              ? " (" + alert.value() + "/" + alert.limit() + ")"
              : "";
      lines.add("• [" + alert.severity().toUpperCase() + "] " + alert.message() + value);
    }
    return "Alertas Provider Manager IA\nTenant: " + tenantId + "\n" + String.join("\n", lines);
  }

  private Map<String, Object> parseConfig(String value) {
    if (value == null || value.isBlank()) {
      return new java.util.HashMap<>();
    }
    try {
      return objectMapper.readValue(value, Map.class);
    } catch (Exception ex) {
      return new java.util.HashMap<>();
    }
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
    }
  }

  public static class CreateChannelRequest {
    public String tenantId;
    public String type;
    public String name;
    public List<String> recipients;
    public String webhookUrl;
    public Boolean enabled;
  }

  public static class UpdateChannelRequest {
    public String tenantId;
    public String type;
    public String name;
    public List<String> recipients;
    public String webhookUrl;
    public Boolean enabled;
  }
}
