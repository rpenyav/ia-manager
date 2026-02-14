package com.neria.manager.chat;

import com.neria.manager.common.entities.Subscription;
import com.neria.manager.common.entities.SubscriptionService;
import com.neria.manager.common.repos.SubscriptionRepository;
import com.neria.manager.common.repos.SubscriptionServiceRepository;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/tenant/chat/auth")
public class TenantChatAuthController {
  private final ChatAuthService chatAuthService;
  private final TenantLoginLogService loginLogService;
  private final SubscriptionServiceRepository subscriptionServiceRepository;
  private final SubscriptionRepository subscriptionRepository;

  public TenantChatAuthController(
      ChatAuthService chatAuthService,
      TenantLoginLogService loginLogService,
      SubscriptionServiceRepository subscriptionServiceRepository,
      SubscriptionRepository subscriptionRepository) {
    this.chatAuthService = chatAuthService;
    this.loginLogService = loginLogService;
    this.subscriptionServiceRepository = subscriptionServiceRepository;
    this.subscriptionRepository = subscriptionRepository;
  }

  @PostMapping("/login")
  public Object login(
      HttpServletRequest request, @RequestBody ChatAuthService.LoginChatUserRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    if (auth.getType() == null || !"serviceApiKey".equals(auth.getType())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service API key required");
    }
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    String serviceCode = auth.getServiceCode();
    if ((serviceCode == null || serviceCode.isBlank())
        && (dto == null || dto.serviceCode == null || dto.serviceCode.isBlank())
        && (dto == null || dto.tenantServiceId == null || dto.tenantServiceId.isBlank())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service code required");
    }
    if (dto != null && dto.tenantServiceId != null && !dto.tenantServiceId.isBlank()) {
      serviceCode = resolveServiceCode(tenantId, dto.tenantServiceId.trim(), serviceCode);
    }
    if (dto != null && dto.serviceCode != null && !dto.serviceCode.isBlank()) {
      String requested = dto.serviceCode.trim();
      if (serviceCode != null && !serviceCode.equals(requested)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service key mismatch");
      }
      serviceCode = requested;
    }
    if (dto != null && (dto.serviceCode == null || dto.serviceCode.isBlank())) {
      dto.serviceCode = serviceCode;
    }
    try {
      Object result = chatAuthService.login(tenantId, dto);
      String userId = null;
      String email = dto != null ? dto.email : null;
      if (result instanceof Map<?, ?> map) {
        Object user = map.get("user");
        if (user instanceof Map<?, ?> userMap) {
          Object idValue = userMap.get("id");
          Object emailValue = userMap.get("email");
          userId = idValue != null ? String.valueOf(idValue) : null;
          if (emailValue != null) {
            email = String.valueOf(emailValue);
          }
        }
      }
      loginLogService.record(
          tenantId,
          serviceCode,
          auth.getApiKeyId(),
          userId,
          email,
          "success",
          null,
          request);
      return result;
    } catch (ResponseStatusException ex) {
      loginLogService.record(
          tenantId,
          serviceCode,
          auth.getApiKeyId(),
          null,
          dto != null ? dto.email : null,
          "failed",
          ex.getReason(),
          request);
      throw ex;
    } catch (Exception ex) {
      loginLogService.record(
          tenantId,
          serviceCode,
          auth.getApiKeyId(),
          null,
          dto != null ? dto.email : null,
          "failed",
          ex.getMessage(),
          request);
      throw ex;
    }
  }

  private String resolveServiceCode(String tenantId, String tenantServiceId, String serviceCode) {
    SubscriptionService assignment =
        subscriptionServiceRepository
            .findById(tenantServiceId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid service id"));
    Subscription subscription =
        subscriptionRepository
            .findById(assignment.getSubscriptionId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid service id"));
    if (!tenantId.equals(subscription.getTenantId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service tenant mismatch");
    }
    if (serviceCode != null && !serviceCode.equals(assignment.getServiceCode())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service key mismatch");
    }
    return assignment.getServiceCode();
  }
}
