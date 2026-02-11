package com.neria.manager.adapters;

import java.util.Map;

public interface ProviderAdapter {
  ProviderInvocationResult invoke(Map<String, Object> credentials, String model, Map<String, Object> payload);
}
