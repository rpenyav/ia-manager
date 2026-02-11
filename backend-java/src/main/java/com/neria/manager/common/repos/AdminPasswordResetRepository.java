package com.neria.manager.common.repos;

import com.neria.manager.common.entities.AdminPasswordReset;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminPasswordResetRepository extends JpaRepository<AdminPasswordReset, String> {
  Optional<AdminPasswordReset> findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
      String tokenHash, LocalDateTime now);
}
