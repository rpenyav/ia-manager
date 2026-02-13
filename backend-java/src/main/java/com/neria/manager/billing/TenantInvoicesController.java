package com.neria.manager.billing;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/tenants/{tenantId}/invoices")
public class TenantInvoicesController {
  private final TenantInvoicesService invoicesService;

  public TenantInvoicesController(TenantInvoicesService invoicesService) {
    this.invoicesService = invoicesService;
  }

  @GetMapping
  public List<Map<String, Object>> list(
      HttpServletRequest request, @PathVariable String tenantId) {
    AuthContext auth = requireAuth(request);
    if ("tenant".equals(auth.getRole())) {
      if (auth.getTenantId() == null || !auth.getTenantId().equals(tenantId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
      }
    } else if (!"admin".equals(auth.getRole())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
    return invoicesService.listByTenant(tenantId);
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }
}
