package com.neria.manager.usage;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.notifications.NotificationsService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/usage")
public class UsageController {
  private final UsageService usageService;
  private final UsageAlertsService alertsService;
  private final NotificationsService notificationsService;

  public UsageController(
      UsageService usageService,
      UsageAlertsService alertsService,
      NotificationsService notificationsService) {
    this.usageService = usageService;
    this.alertsService = alertsService;
    this.notificationsService = notificationsService;
  }

  @GetMapping("/summary")
  public Object summary(
      HttpServletRequest request, @RequestParam(value = "tenantId", required = false) String tenantId) {
    AuthContext auth = requireAuth(request);
    String resolved = auth.getTenantId() != null ? auth.getTenantId() : tenantId;
    if (resolved != null && !resolved.isBlank()) {
      return usageService.getSummaryByTenant(resolved);
    }
    return usageService.getSummaryAll();
  }

  @GetMapping("/alerts")
  public List<UsageAlertsService.UsageAlert> alerts(
      HttpServletRequest request, @RequestParam(value = "tenantId", required = false) String tenantId) {
    AuthContext auth = requireAuth(request);
    String resolved = auth.getTenantId() != null ? auth.getTenantId() : tenantId;
    return alertsService.list(resolved);
  }

  @GetMapping("/events")
  public List<?> events(
      HttpServletRequest request,
      @RequestParam(value = "tenantId", required = false) String tenantId,
      @RequestParam(value = "limit", required = false) Integer limit) {
    AuthContext auth = requireAuth(request);
    String resolved = auth.getTenantId() != null ? auth.getTenantId() : tenantId;
    int parsed = limit == null ? 20 : Math.min(Math.max(limit, 1), 200);
    if (resolved == null || resolved.isBlank()) {
      return usageService.listEventsAll(parsed);
    }
    return usageService.listEvents(resolved, parsed);
  }

  @PostMapping("/alerts/notify")
  public Map<String, Object> notify(
      HttpServletRequest request, @RequestBody Map<String, String> body) {
    AuthContext auth = requireAuth(request);
    String resolved = auth.getTenantId() != null ? auth.getTenantId() : body.get("tenantId");
    if (resolved == null || resolved.isBlank()) {
      return Map.of("sent", 0);
    }
    List<UsageAlertsService.UsageAlert> alerts = alertsService.list(resolved);
    return notificationsService.sendAlerts(resolved, alerts);
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }
}
