package com.neria.manager.tenants;

import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/tenants")
public class TenantsController {
  private final TenantsService tenantsService;

  public TenantsController(TenantsService tenantsService) {
    this.tenantsService = tenantsService;
  }

  @GetMapping
  public List<Tenant> list(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    String tenantId = "tenant".equals(auth.getRole()) ? auth.getTenantId() : null;
    return tenantsService.list(tenantId);
  }

  @PostMapping
  public Tenant create(
      HttpServletRequest request, @RequestBody TenantsService.CreateTenantRequest dto) {
    requireAdmin(request);
    return tenantsService.create(dto);
  }

  @PatchMapping("/me")
  public Tenant updateSelf(
      HttpServletRequest request, @RequestBody TenantsService.UpdateTenantSelfRequest dto) {
    AuthContext auth = requireAuth(request);
    if (!"tenant".equals(auth.getRole()) || auth.getTenantId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant credentials required");
    }
    return tenantsService.updateSelf(auth.getTenantId(), dto);
  }

  @PatchMapping("/{id}")
  public Tenant update(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @RequestBody TenantsService.UpdateTenantRequest dto) {
    requireAdmin(request);
    return tenantsService.update(id, dto);
  }

  @PatchMapping("/{id}/kill-switch")
  public Tenant toggleKillSwitch(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @RequestBody Map<String, Object> body) {
    requireAdmin(request);
    boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
    return tenantsService.toggleKillSwitch(id, enabled);
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
}
