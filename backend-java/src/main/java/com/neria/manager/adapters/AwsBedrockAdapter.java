package com.neria.manager.adapters;

import java.util.Map;

public class AwsBedrockAdapter implements ProviderAdapter {
  @Override
  public ProviderInvocationResult invoke(
      Map<String, Object> credentials, String model, Map<String, Object> payload) {
    throw new IllegalStateException("AWS Bedrock adapter not implemented in Java backend yet");
  }
}
