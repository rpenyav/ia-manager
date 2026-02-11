package com.neria.manager.policies;

import com.neria.manager.common.entities.Policy;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/policies")
public class PoliciesController {
  private final PoliciesService policiesService;

  public PoliciesController(PoliciesService policiesService) {
    this.policiesService = policiesService;
  }

  @GetMapping
  public Policy get(HttpServletRequest request) {
    String tenantId = resolveTenantId(request);
    return policiesService.getByTenant(tenantId);
  }

  @GetMapping("/admin")
  public List<Policy> listAll(HttpServletRequest request) {
    requireAdmin(request);
    return policiesService.listAll();
  }

  @PutMapping
  public Policy upsert(
      HttpServletRequest request, @RequestBody PoliciesService.UpdatePolicyRequest dto) {
    requireAdmin(request);
    String tenantId = resolveTenantId(request);
    return policiesService.upsert(tenantId, dto);
  }

  @DeleteMapping("/{tenantId}")
  public void delete(HttpServletRequest request, @PathVariable("tenantId") String tenantId) {
    requireAdmin(request);
    policiesService.deleteByTenant(tenantId);
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
