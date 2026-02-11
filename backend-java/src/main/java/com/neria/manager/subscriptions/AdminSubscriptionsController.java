package com.neria.manager.subscriptions;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/subscriptions")
public class AdminSubscriptionsController {
  private final SubscriptionsService subscriptionsService;

  public AdminSubscriptionsController(SubscriptionsService subscriptionsService) {
    this.subscriptionsService = subscriptionsService;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return subscriptionsService.listAdminSummary();
  }

  @PostMapping("/{tenantId}/approve")
  public Map<String, Object> approve(@PathVariable String tenantId) {
    return subscriptionsService.approvePaymentByAdmin(tenantId);
  }
}
