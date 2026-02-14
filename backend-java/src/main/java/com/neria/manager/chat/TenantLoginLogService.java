package com.neria.manager.chat;

import com.neria.manager.common.entities.TenantLoginLog;
import com.neria.manager.common.repos.TenantLoginLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TenantLoginLogService {
  private final TenantLoginLogRepository repository;

  public TenantLoginLogService(TenantLoginLogRepository repository) {
    this.repository = repository;
  }

  public TenantLoginLog record(
      String tenantId,
      String serviceCode,
      String apiKeyId,
      String userId,
      String email,
      String status,
      String error,
      HttpServletRequest request) {
    TenantLoginLog log = new TenantLoginLog();
    log.setId(UUID.randomUUID().toString());
    log.setTenantId(tenantId);
    log.setServiceCode(serviceCode);
    log.setApiKeyId(apiKeyId);
    log.setUserId(userId);
    log.setEmail(email);
    log.setStatus(status);
    log.setError(error);
    log.setIpAddress(resolveIp(request));
    log.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
    log.setCreatedAt(LocalDateTime.now());
    return repository.save(log);
  }

  private String resolveIp(HttpServletRequest request) {
    if (request == null) {
      return null;
    }
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
