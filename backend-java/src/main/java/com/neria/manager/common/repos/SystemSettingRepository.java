package com.neria.manager.common.repos;

import com.neria.manager.common.entities.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {}
