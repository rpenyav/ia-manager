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

public class AzureOpenAIAdapter implements ProviderAdapter {
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public AzureOpenAIAdapter(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.httpClient =
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
  }

  @Override
  public ProviderInvocationResult invoke(
      Map<String, Object> credentials, String model, Map<String, Object> payload) {
    String endpoint = String.valueOf(credentials.getOrDefault("endpoint", ""));
    String apiKey = String.valueOf(credentials.getOrDefault("apiKey", ""));
    String deployment = String.valueOf(credentials.getOrDefault("deployment", model));
    String apiVersion = String.valueOf(credentials.getOrDefault("apiVersion", "2024-02-15-preview"));

    if (endpoint == null || endpoint.isBlank() || apiKey == null || apiKey.isBlank() || deployment == null || deployment.isBlank()) {
      throw new IllegalArgumentException(
          "Missing Azure OpenAI credentials (endpoint, apiKey, deployment)");
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

    String url =
        endpoint + "/openai/deployments/" + deployment + "/chat/completions?api-version=" + apiVersion;

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(60))
            .header("api-key", apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (IOException | InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Azure OpenAI request failed", ex);
    }

    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("Azure OpenAI error: " + response.statusCode() + " " + response.body());
    }

    Map<String, Object> parsed;
    try {
      parsed = objectMapper.readValue(response.body(), Map.class);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to parse Azure response", ex);
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
