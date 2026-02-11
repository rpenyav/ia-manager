package com.neria.manager.auth;

import com.neria.manager.common.entities.ApiKey;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.services.JwtService;
import com.neria.manager.config.AppProperties;
import io.jsonwebtoken.Claims;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final JwtService jwtService;
  private final ApiKeysService apiKeysService;
  private final AppProperties properties;

  public AuthService(JwtService jwtService, ApiKeysService apiKeysService, AppProperties properties) {
    this.jwtService = jwtService;
    this.apiKeysService = apiKeysService;
    this.properties = properties;
  }

  public TokenResult issueToken(String clientId, String clientSecret) {
    String adminClientId = properties.getAuth().getAdminClientId();
    String adminClientSecret = properties.getAuth().getAdminClientSecret();
    if (!adminClientId.equals(clientId) || !adminClientSecret.equals(clientSecret)) {
      throw new IllegalArgumentException("Invalid client credentials");
    }
    return issueAdminToken(clientId, "admin");
  }

  public TokenResult issueAdminToken(String username, String role) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("sub", username);
    claims.put("role", role);
    String token = jwtService.sign(claims);
    return new TokenResult(token, jwtService.getTtlSeconds());
  }

  public TokenResult issueTenantToken(String tenantId, String username) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("sub", username);
    claims.put("role", "tenant");
    claims.put("tenantId", tenantId);
    String token = jwtService.sign(claims);
    return new TokenResult(token, jwtService.getTtlSeconds());
  }

  public AuthContext validateJwt(String token) {
    Claims claims = jwtService.verify(token);
    return AuthContext.builder()
        .type("jwt")
        .sub(String.valueOf(claims.get("sub")))
        .role(String.valueOf(claims.get("role")))
        .tenantId(claims.get("tenantId") != null ? String.valueOf(claims.get("tenantId")) : null)
        .build();
  }

  public AuthContext validateApiKey(String apiKey) {
    ApiKey record = apiKeysService.validate(apiKey);
    if (record == null) {
      throw new IllegalArgumentException("Invalid API key");
    }
    return AuthContext.builder()
        .type("apiKey")
        .tenantId(record.getTenantId())
        .apiKeyId(record.getId())
        .build();
  }

  public record TokenResult(String accessToken, long expiresIn) {}
}
