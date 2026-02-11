package com.neria.manager.providers;

import com.neria.manager.common.entities.Provider;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/providers")
public class ProvidersController {
  private final ProvidersService providersService;

  public ProvidersController(ProvidersService providersService) {
    this.providersService = providersService;
  }

  @GetMapping
  public List<Provider> list(HttpServletRequest request) {
    String tenantId = resolveTenantId(request);
    return providersService.list(tenantId);
  }

  @PostMapping
  public Provider create(
      HttpServletRequest request, @RequestBody ProvidersService.CreateProviderRequest dto) {
    requireAdmin(request);
    String tenantId = resolveTenantId(request);
    return providersService.create(tenantId, dto);
  }

  @PatchMapping("/{id}")
  public Provider update(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @RequestBody ProvidersService.UpdateProviderRequest dto) {
    requireAdmin(request);
    String tenantId = resolveTenantId(request);
    return providersService.update(tenantId, id, dto);
  }

  private String resolveTenantId(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      return auth.getTenantId();
    }
    String header = request.getHeader("x-tenant-id");
    if (header == null || header.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing X-Tenant-Id header");
    }
    return header;
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }

  private void requireAdmin(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
  }
}
