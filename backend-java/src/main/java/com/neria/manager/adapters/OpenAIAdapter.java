package com.neria.manager.adapters;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class OpenAIAdapter implements ProviderAdapter {
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public OpenAIAdapter(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.httpClient =
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
  }

  @Override
  public ProviderInvocationResult invoke(
      Map<String, Object> credentials, String model, Map<String, Object> payload) {
    String apiKey = String.valueOf(credentials.getOrDefault("apiKey", ""));
    String baseUrl = String.valueOf(credentials.getOrDefault("baseUrl", "https://api.openai.com"));
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalArgumentException("Missing OpenAI apiKey");
    }

    Map<String, Object> body = new HashMap<>();
    body.put("model", model);
    if (payload != null) {
      body.putAll(payload);
    }

    String json;
    try {
      json = objectMapper.writeValueAsString(body);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Invalid payload JSON");
    }

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/v1/chat/completions"))
            .timeout(Duration.ofSeconds(60))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (IOException | InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("OpenAI request failed", ex);
    }

    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("OpenAI error: " + response.statusCode() + " " + response.body());
    }

    Map<String, Object> parsed;
    try {
      parsed = objectMapper.readValue(response.body(), Map.class);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to parse OpenAI response", ex);
    }

    Map<String, Object> usage =
        parsed.get("usage") instanceof Map ? (Map<String, Object>) parsed.get("usage") : Map.of();
    int tokensIn = toInt(usage.get("prompt_tokens"));
    int tokensOut = toInt(usage.get("completion_tokens"));

    return new ProviderInvocationResult(parsed, tokensIn, tokensOut, 0d);
  }

  private int toInt(Object value) {
    if (value instanceof Number) {
      return ((Number) value).intValue();
    }
    if (value == null) {
      return 0;
    }
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return 0;
    }
  }
}
