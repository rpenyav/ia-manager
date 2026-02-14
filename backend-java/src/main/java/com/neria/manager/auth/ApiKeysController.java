package com.neria.manager.auth;

import com.neria.manager.common.entities.ApiKey;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth/api-keys")
public class ApiKeysController {
  private final ApiKeysService apiKeysService;

  public ApiKeysController(ApiKeysService apiKeysService) {
    this.apiKeysService = apiKeysService;
  }

  @PostMapping
  public ApiKeysService.ApiKeyCreateResult create(
      HttpServletRequest request, @RequestBody CreateApiKeyRequest dto) {
    requireAdmin(request);
    return apiKeysService.create(dto.name, dto.tenantId);
  }

  @GetMapping
  public List<ApiKey> list(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    String tenantId = "tenant".equals(auth.getRole()) ? auth.getTenantId() : null;
    return apiKeysService.list(tenantId);
  }

  @PatchMapping("/{id}/revoke")
  public ApiKey revoke(HttpServletRequest request, @PathVariable("id") String id) {
    requireAdmin(request);
    ApiKey updated = apiKeysService.revoke(id);
    if (updated == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Api key not found");
    }
    return updated;
  }

  @PatchMapping("/{id}/rotate")
  public ApiKeysService.ApiKeyCreateResult rotate(
      HttpServletRequest request, @PathVariable("id") String id) {
    throw new ResponseStatusException(
        HttpStatus.FORBIDDEN, "API key rotation disabled");
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }

  private AuthContext requireAdmin(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
    return auth;
  }

  public static class CreateApiKeyRequest {
    public String name;
    public String tenantId;
  }
}
