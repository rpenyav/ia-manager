package com.neria.manager.webhooks;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.Webhook;
import com.neria.manager.common.repos.WebhookRepository;
import com.neria.manager.common.services.EncryptionService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WebhooksService {
  private final WebhookRepository repository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newHttpClient();

  public WebhooksService(
      WebhookRepository repository, EncryptionService encryptionService, ObjectMapper objectMapper) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.objectMapper = objectMapper;
  }

  public List<Map<String, Object>> list() {
    return repository.findAllByOrderByCreatedAtDesc().stream().map(this::sanitize).toList();
  }

  public Map<String, Object> create(CreateWebhookRequest dto) {
    Webhook webhook = new Webhook();
    webhook.setId(UUID.randomUUID().toString());
    webhook.setTenantId(dto.tenantId);
    webhook.setUrl(dto.url);
    webhook.setEvents(toJson(dto.events));
    webhook.setEncryptedSecret(dto.secret != null && !dto.secret.isBlank()
        ? encryptionService.encrypt(dto.secret)
        : null);
    webhook.setEnabled(dto.enabled != null ? dto.enabled : true);
    webhook.setCreatedAt(LocalDateTime.now());
    webhook.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(webhook));
  }

  public Map<String, Object> update(String id, UpdateWebhookRequest dto) {
    Webhook webhook = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webhook not found"));

    if (dto.tenantId != null) {
      webhook.setTenantId(dto.tenantId);
    }
    if (dto.url != null) {
      webhook.setUrl(dto.url);
    }
    if (dto.events != null) {
      webhook.setEvents(toJson(dto.events));
    }
    if (dto.enabled != null) {
      webhook.setEnabled(dto.enabled);
    }
    if (dto.secret != null) {
      webhook.setEncryptedSecret(dto.secret.isBlank() ? null : encryptionService.encrypt(dto.secret));
    }
    webhook.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(webhook));
  }

  public void enqueue(WebhookEventPayload payload) {
    List<Webhook> hooks = repository.findByEnabled(true);
    List<Webhook> targets = hooks.stream()
        .filter(hook -> hook.getTenantId() == null || hook.getTenantId().equals(payload.tenantId))
        .filter(hook -> {
          List<String> events = parseEvents(hook.getEvents());
          return events.contains("*") || events.contains(payload.eventType);
        })
        .toList();
    for (Webhook hook : targets) {
      deliver(hook, payload);
    }
  }

  public void deliver(Webhook webhook, WebhookEventPayload payload) {
    if (!webhook.isEnabled()) {
      return;
    }
    try {
      String body = objectMapper.writeValueAsString(payload);
      HttpRequest.Builder builder = HttpRequest.newBuilder()
          .uri(URI.create(webhook.getUrl()))
          .header("Content-Type", "application/json")
          .header("User-Agent", "ProviderManagerWebhook/1.0")
          .POST(HttpRequest.BodyPublishers.ofString(body));

      if (webhook.getEncryptedSecret() != null && !webhook.getEncryptedSecret().isBlank()) {
        String secret = encryptionService.decrypt(webhook.getEncryptedSecret());
        builder.header("x-signature", signPayload(secret, body));
      }

      HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new IllegalStateException(
            "Webhook delivery failed: " + response.statusCode() + " " + response.body());
      }
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }
  }

  private Map<String, Object> sanitize(Webhook hook) {
    return Map.of(
        "id", hook.getId(),
        "tenantId", hook.getTenantId(),
        "url", hook.getUrl(),
        "events", parseEvents(hook.getEvents()),
        "enabled", hook.isEnabled(),
        "createdAt", hook.getCreatedAt(),
        "updatedAt", hook.getUpdatedAt());
  }

  private String signPayload(String secret, String payload) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      return toHex(raw);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to sign webhook payload");
    }
  }

  private String toHex(byte[] data) {
    StringBuilder sb = new StringBuilder();
    for (byte b : data) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }

  private List<String> parseEvents(String value) {
    if (value == null || value.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(value, List.class);
    } catch (Exception ex) {
      return List.of();
    }
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
    }
  }

  public static class WebhookEventPayload {
    public String eventType;
    public String tenantId;
    public Map<String, Object> data;
    public String createdAt;
  }

  public static class CreateWebhookRequest {
    public String tenantId;
    public String url;
    public List<String> events;
    public String secret;
    public Boolean enabled;
  }

  public static class UpdateWebhookRequest {
    public String tenantId;
    public String url;
    public List<String> events;
    public String secret;
    public Boolean enabled;
  }
}
