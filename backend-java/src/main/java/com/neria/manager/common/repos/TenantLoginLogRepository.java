package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantLoginLogRepository extends JpaRepository<TenantLoginLog, String> {}
