package com.neria.manager.audit;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/audit")
public class AuditController {
  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @GetMapping
  public List<?> list(
      HttpServletRequest request,
      @RequestParam(value = "limit", required = false) Integer limit,
      @RequestParam(value = "tenantId", required = false) String tenantId) {
    AuthContext auth = requireAuth(request);
    String resolvedTenant = "tenant".equals(auth.getRole()) ? auth.getTenantId() : tenantId;
    int parsed = limit == null ? 100 : Math.min(Math.max(limit, 1), 500);
    return auditService.list(parsed, resolvedTenant);
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }
}
