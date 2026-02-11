package com.neria.manager.common.repos;

import com.neria.manager.common.entities.ChatUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatUserRepository extends JpaRepository<ChatUser, String> {
  List<ChatUser> findByTenantIdOrderByCreatedAtDesc(String tenantId);

  Optional<ChatUser> findByTenantIdAndEmail(String tenantId, String email);

  Optional<ChatUser> findByIdAndTenantId(String id, String tenantId);

  List<ChatUser> findByTenantIdAndIdIn(String tenantId, List<String> ids);
}
