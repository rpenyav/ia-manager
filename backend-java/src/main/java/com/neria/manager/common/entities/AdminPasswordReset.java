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
@Table(name = "admin_password_resets")
public class AdminPasswordReset {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "userId", length = 36, nullable = false)
  private String userId;

  @Column(name = "tokenHash", length = 64, nullable = false)
  private String tokenHash;

  @Column(name = "expiresAt", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "usedAt")
  private LocalDateTime usedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
