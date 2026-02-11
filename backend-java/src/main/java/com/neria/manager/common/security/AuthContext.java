package com.neria.manager.common.security;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthContext {
  private final String type;
  private final String sub;
  private final String role;
  private final String tenantId;
  private final String apiKeyId;
}
