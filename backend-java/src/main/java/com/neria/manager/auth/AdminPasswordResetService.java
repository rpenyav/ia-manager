package com.neria.manager.auth;

import com.neria.manager.common.entities.AdminPasswordReset;
import com.neria.manager.common.entities.AdminUser;
import com.neria.manager.common.repos.AdminPasswordResetRepository;
import com.neria.manager.common.repos.AdminUserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AdminPasswordResetService {
  private final AdminPasswordResetRepository resets;
  private final AdminUserRepository users;

  public AdminPasswordResetService(
      AdminPasswordResetRepository resets, AdminUserRepository users) {
    this.resets = resets;
    this.users = users;
  }

  public ResetResult createReset(String identifier, int ttlMinutes) {
    Optional<AdminUser> user =
        users.findByUsername(identifier).or(() -> users.findAll().stream()
            .filter(item -> identifier.equalsIgnoreCase(item.getEmail()))
            .findFirst());
    if (user.isEmpty()) {
      return null;
    }
    String token = UUID.randomUUID().toString().replace("-", "");
    AdminPasswordReset reset = new AdminPasswordReset();
    reset.setId(UUID.randomUUID().toString());
    reset.setUserId(user.get().getId());
    reset.setTokenHash(hashToken(token));
    reset.setExpiresAt(LocalDateTime.now().plusMinutes(ttlMinutes));
    reset.setCreatedAt(LocalDateTime.now());
    resets.save(reset);
    return new ResetResult(token, user.get());
  }

  public String consumeReset(String token) {
    AdminPasswordReset reset =
        resets
            .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
                hashToken(token), LocalDateTime.now())
            .orElseThrow();
    reset.setUsedAt(LocalDateTime.now());
    resets.save(reset);
    return reset.getUserId();
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] result = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(result.length * 2);
      for (byte b : result) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash token", ex);
    }
  }

  public record ResetResult(String token, AdminUser user) {}
}
