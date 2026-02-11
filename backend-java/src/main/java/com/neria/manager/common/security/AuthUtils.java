package com.neria.manager.common.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AuthUtils {
  private AuthUtils() {}

  public static AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing credentials");
    }
    return auth;
  }

  public static void requireRole(AuthContext auth, String... roles) {
    if (auth == null || auth.getRole() == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
    boolean allowed = Arrays.stream(roles).anyMatch(role -> role.equals(auth.getRole()));
    if (!allowed) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
  }

  public static void requireAdmin(AuthContext auth) {
    requireRole(auth, "admin");
  }

  public static void requireTenantScope(AuthContext auth, String tenantId) {
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing credentials");
    }
    if ("tenant".equals(auth.getRole())) {
      if (auth.getTenantId() == null || !auth.getTenantId().equals(tenantId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant scope mismatch");
      }
    }
  }

  public static String resolveTenantId(AuthContext auth, HttpServletRequest request) {
    if (auth != null && auth.getTenantId() != null && !auth.getTenantId().isBlank()) {
      return auth.getTenantId();
    }
    String header = request.getHeader("x-tenant-id");
    if (header == null || header.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing X-Tenant-Id header");
    }
    return header;
  }
}
