package com.neria.manager.subscriptions;

import com.neria.manager.subscriptions.SubscriptionsService.CreateSubscriptionRequest;
import com.neria.manager.subscriptions.SubscriptionsService.UpdateSubscriptionRequest;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/subscription")
public class SubscriptionsController {
  private final SubscriptionsService subscriptionsService;

  public SubscriptionsController(SubscriptionsService subscriptionsService) {
    this.subscriptionsService = subscriptionsService;
  }

  @GetMapping
  public Map<String, Object> get(@PathVariable String tenantId) {
    return subscriptionsService.getByTenantId(tenantId);
  }

  @PostMapping
  public Map<String, Object> create(
      @PathVariable String tenantId, @RequestBody CreateSubscriptionRequest dto) {
    return subscriptionsService.create(tenantId, dto);
  }

  @PatchMapping
  public Map<String, Object> update(
      @PathVariable String tenantId, @RequestBody UpdateSubscriptionRequest dto) {
    return subscriptionsService.update(tenantId, dto);
  }

  @DeleteMapping
  public Map<String, Object> delete(
      @PathVariable String tenantId, HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return subscriptionsService.deleteByTenantId(tenantId);
  }

  @DeleteMapping("/services/{tenantServiceId}")
  public Map<String, Object> deleteServiceAssignment(
      @PathVariable String tenantId,
      @PathVariable String tenantServiceId,
      HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    AuthUtils.requireTenantScope(auth, tenantId);
    return subscriptionsService.deleteServiceAssignment(tenantId, tenantServiceId);
  }
}
