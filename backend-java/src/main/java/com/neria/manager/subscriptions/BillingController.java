package com.neria.manager.subscriptions;

import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/billing")
public class BillingController {
  private final SubscriptionsService subscriptionsService;

  public BillingController(SubscriptionsService subscriptionsService) {
    this.subscriptionsService = subscriptionsService;
  }

  @PostMapping("/confirm")
  public Map<String, Object> confirm(@RequestBody Map<String, String> body) {
    return subscriptionsService.confirmPaymentByToken(body.getOrDefault("token", ""));
  }

  @PostMapping("/stripe/confirm")
  public Map<String, Object> confirmStripe(@RequestBody Map<String, String> body) {
    return subscriptionsService.confirmStripeSession(body.getOrDefault("sessionId", ""));
  }
}
