package com.neria.manager.tenantpricing;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/tenants/{tenantId}/pricing")
public class TenantPricingController {
  private final TenantPricingService tenantPricingService;

  public TenantPricingController(TenantPricingService tenantPricingService) {
    this.tenantPricingService = tenantPricingService;
  }

  @GetMapping
  public TenantPricingService.TenantPricingResponse get(
      HttpServletRequest request, @PathVariable("tenantId") String tenantId) {
    requireAuth(request, tenantId);
    return tenantPricingService.getByTenantId(tenantId);
  }

  @PutMapping
  public TenantPricingService.TenantPricingResponse upsert(
      HttpServletRequest request,
      @PathVariable("tenantId") String tenantId,
      @RequestBody(required = false) TenantPricingService.TenantPricingUpdateRequest dto) {
    requireAuth(request, tenantId);
    if (dto == null) {
      dto = new TenantPricingService.TenantPricingUpdateRequest(java.util.List.of());
    }
    return tenantPricingService.upsert(tenantId, dto);
  }

  private void requireAuth(HttpServletRequest request, String tenantId) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    if ("tenant".equals(auth.getRole())) {
      if (auth.getTenantId() == null || !auth.getTenantId().equals(tenantId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant scope required");
      }
      return;
    }
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
  }
}
