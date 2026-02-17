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
@Table(name = "admin_users")
public class AdminUser {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 120)
  private String username;

  @Column(length = 120)
  private String name;

  @Column(length = 160)
  private String email;

  @Column(name = "passwordHash", length = 255)
  private String passwordHash;

  @Column(name = "mustChangePassword", nullable = false)
  private boolean mustChangePassword;

  @Column(nullable = false, length = 32)
  private String role;

  @Column(nullable = false, length = 16)
  private String status;

  @Column(name = "language", length = 8)
  private String language;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
