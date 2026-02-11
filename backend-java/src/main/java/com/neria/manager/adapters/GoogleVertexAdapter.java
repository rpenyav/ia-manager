package com.neria.manager.adapters;

import java.util.Map;

public class GoogleVertexAdapter implements ProviderAdapter {
  @Override
  public ProviderInvocationResult invoke(
      Map<String, Object> credentials, String model, Map<String, Object> payload) {
    throw new IllegalStateException("Google Vertex adapter not implemented in Java backend yet");
  }
}
