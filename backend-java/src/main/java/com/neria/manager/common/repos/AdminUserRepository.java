package com.neria.manager.common.repos;

import com.neria.manager.common.entities.AdminUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, String> {
  Optional<AdminUser> findByUsername(String username);
}
