package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "system_settings")
public class SystemSetting {
  @Id
  @Column(name = "key", length = 64)
  private String key;

  @Column(columnDefinition = "json", nullable = false)
  private String value;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
