package com.neria.manager.adapters;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdaptersService {
  private final ObjectMapper objectMapper;

  public AdaptersService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public ProviderInvocationResult invokeProvider(
      String providerType, String credentialsJson, String model, Map<String, Object> payload) {
    String normalized = providerType == null ? "openai" : providerType.toLowerCase();
    Map<String, Object> credentials = safeParse(credentialsJson);
    ProviderAdapter adapter = resolveAdapter(normalized);
    return adapter.invoke(credentials, model, payload);
  }

  private ProviderAdapter resolveAdapter(String providerType) {
    return switch (providerType) {
      case "azure", "azure_openai", "azure-openai" -> new AzureOpenAIAdapter(objectMapper);
      case "aws", "bedrock", "aws-bedrock" -> new AwsBedrockAdapter();
      case "google", "gcp", "vertex", "vertex-ai" -> new GoogleVertexAdapter();
      case "mock" -> new MockAdapter();
      case "openai" -> new OpenAIAdapter(objectMapper);
      default -> new OpenAIAdapter(objectMapper);
    };
  }

  private Map<String, Object> safeParse(String credentials) {
    if (credentials == null || credentials.isBlank()) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(credentials, Map.class);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Invalid credentials format, must be JSON");
    }
  }
}
