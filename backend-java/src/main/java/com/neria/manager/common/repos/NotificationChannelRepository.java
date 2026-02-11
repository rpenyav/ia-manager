package com.neria.manager.common.repos;

import com.neria.manager.common.entities.NotificationChannel;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationChannelRepository extends JpaRepository<NotificationChannel, String> {
  List<NotificationChannel> findByTenantId(String tenantId);

  List<NotificationChannel> findAllByOrderByCreatedAtDesc();

  List<NotificationChannel> findByTenantIdOrTenantIdIsNull(String tenantId);
}
