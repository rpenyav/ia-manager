package com.neria.manager.auth;

import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.repos.TenantRepository;
import com.neria.manager.common.services.ScryptHasher;
import com.neria.manager.config.AppProperties;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class TenantAuthService {
  private final TenantRepository tenantRepository;
  private final ScryptHasher hasher;
  private final String salt;

  public TenantAuthService(
      TenantRepository tenantRepository, ScryptHasher hasher, AppProperties properties) {
    this.tenantRepository = tenantRepository;
    this.hasher = hasher;
    this.salt = Optional.ofNullable(properties.getSecurity().getTenantPasswordSalt()).orElse("");
    if (this.salt.length() < 16) {
      throw new IllegalStateException("TENANT_PASSWORD_SALT must be at least 16 characters");
    }
  }

  public Tenant validateCredentials(String username, String password) {
    Tenant tenant = tenantRepository.findByAuthUsername(username).orElseThrow();
    if (!hasher.matches(password, salt, tenant.getAuthPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    return tenant;
  }

  public void setPassword(String tenantId, String password, boolean mustChangePassword) {
    Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();
    tenant.setAuthPasswordHash(hashPassword(password));
    tenant.setAuthMustChangePassword(mustChangePassword);
    tenant.setUpdatedAt(LocalDateTime.now());
    tenantRepository.save(tenant);
  }

  public String hashPassword(String value) {
    return hasher.hash(value, salt);
  }
}
