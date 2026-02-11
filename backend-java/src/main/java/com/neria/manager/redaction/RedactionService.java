package com.neria.manager.redaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RedactionService {
  private final ObjectMapper objectMapper;

  public RedactionService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public Map<String, Object> redact(Map<String, Object> payload) {
    if (payload == null) {
      return Map.of();
    }
    // Simple clone to avoid mutating input. Real redaction can be added later.
    return objectMapper.convertValue(payload, Map.class);
  }
}
