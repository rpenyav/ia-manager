package com.neria.manager.adapters;

import java.util.Map;

public class MockAdapter implements ProviderAdapter {
  @Override
  public ProviderInvocationResult invoke(
      Map<String, Object> credentials, String model, Map<String, Object> payload) {
    Map<String, Object> output =
        Map.of(
            "id", "mock",
            "object", "chat.completion",
            "model", model,
            "choices", java.util.List.of(Map.of("message", Map.of("role", "assistant", "content", "Mock response"))),
            "usage", Map.of("prompt_tokens", 0, "completion_tokens", 0));
    return new ProviderInvocationResult(output, 0, 0, 0d);
  }
}
