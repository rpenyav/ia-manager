package com.neria.manager.auth;

import com.neria.manager.common.entities.AdminUser;
import com.neria.manager.common.repos.AdminUserRepository;
import com.neria.manager.common.services.ScryptHasher;
import com.neria.manager.config.AppProperties;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AdminUsersService {
  private final AdminUserRepository repository;
  private final ScryptHasher hasher;
  private final String salt;

  public AdminUsersService(AdminUserRepository repository, ScryptHasher hasher, AppProperties properties) {
    this.repository = repository;
    this.hasher = hasher;
    this.salt = Optional.ofNullable(properties.getSecurity().getAdminPasswordSalt()).orElse("");
    if (this.salt.length() < 16) {
      throw new IllegalStateException("ADMIN_PASSWORD_SALT must be at least 16 characters");
    }
  }

  public AdminUser getOrCreate(String username) {
    return repository.findByUsername(username).orElseGet(() -> {
      AdminUser user = new AdminUser();
      user.setId(UUID.randomUUID().toString());
      user.setUsername(username);
      user.setRole("admin");
      user.setStatus("active");
      user.setMustChangePassword(true);
      user.setCreatedAt(LocalDateTime.now());
      user.setUpdatedAt(LocalDateTime.now());
      return repository.save(user);
    });
  }

  public AdminUser getOrCreate(String username, String initialPassword) {
    AdminUser user = getOrCreate(username);
    if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
      user.setPasswordHash(hashPassword(initialPassword));
      user.setMustChangePassword(true);
      user.setUpdatedAt(LocalDateTime.now());
      return repository.save(user);
    }
    return user;
  }

  public AdminUser validateCredentials(String username, String password) {
    AdminUser user =
        repository
            .findByUsername(username)
            .orElseGet(
                () -> repository.findAll().stream()
                    .filter(
                        existing ->
                            existing.getEmail() != null
                                && existing.getEmail().equalsIgnoreCase(username))
                    .findFirst()
                    .orElseThrow());
    if (!"active".equals(user.getStatus())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    if (!hasher.matches(password, salt, user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }
    return user;
  }

  public List<AdminUserView> list() {
    return repository.findAll().stream()
        .sorted(Comparator.comparing(AdminUser::getCreatedAt).reversed())
        .map(this::sanitize)
        .toList();
  }

  public AdminUserView create(CreateAdminUserRequest dto) {
    if (repository.findByUsername(dto.username).isPresent()) {
      throw new IllegalArgumentException("Username already exists");
    }
    AdminUser user = new AdminUser();
    user.setId(UUID.randomUUID().toString());
    user.setUsername(dto.username);
    user.setName(dto.name);
    user.setEmail(dto.email);
    user.setRole(dto.role != null ? dto.role : "editor");
    user.setStatus(dto.status != null ? dto.status : "active");
    user.setPasswordHash(hashPassword(dto.password));
    user.setMustChangePassword(true);
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(user));
  }

  public AdminUserView update(String id, UpdateAdminUserRequest dto) {
    AdminUser user = repository.findById(id).orElseThrow();
    if (dto.name != null) user.setName(dto.name);
    if (dto.email != null) user.setEmail(dto.email);
    if (dto.role != null) user.setRole(dto.role);
    if (dto.status != null) user.setStatus(dto.status);
    if (dto.password != null && !dto.password.isBlank()) {
      user.setPasswordHash(hashPassword(dto.password));
      user.setMustChangePassword(true);
    }
    user.setUpdatedAt(LocalDateTime.now());
    return sanitize(repository.save(user));
  }

  public AdminUserView remove(String id, String currentUsername) {
    AdminUser user = repository.findById(id).orElseThrow();
    if (currentUsername != null && currentUsername.equals(user.getUsername())) {
      throw new IllegalArgumentException("Cannot delete your own user");
    }
    repository.deleteById(id);
    return sanitize(user);
  }

  public AdminUser updateProfile(String username, UpdateProfileRequest dto) {
    AdminUser user = getOrCreate(username);
    if (dto.name != null) {
      user.setName(dto.name);
    }
    if (dto.email != null) {
      user.setEmail(dto.email);
    }
    if (dto.password != null && !dto.password.isBlank()) {
      user.setPasswordHash(hashPassword(dto.password));
      user.setMustChangePassword(false);
    }
    user.setUpdatedAt(LocalDateTime.now());
    return repository.save(user);
  }

  public void setPasswordById(String userId, String password) {
    AdminUser user = repository.findById(userId).orElseThrow();
    user.setPasswordHash(hashPassword(password));
    user.setMustChangePassword(false);
    user.setUpdatedAt(LocalDateTime.now());
    repository.save(user);
  }

  private String hashPassword(String value) {
    return hasher.hash(value, salt);
  }

  public record UpdateProfileRequest(String name, String email, String password) {}

  public record CreateAdminUserRequest(
      String username, String name, String email, String role, String status, String password) {}

  public record UpdateAdminUserRequest(
      String name, String email, String role, String status, String password) {}

  public record AdminUserView(
      String id,
      String username,
      String name,
      String email,
      String role,
      String status,
      boolean mustChangePassword,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  private AdminUserView sanitize(AdminUser user) {
    return new AdminUserView(
        user.getId(),
        user.getUsername(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        user.getStatus(),
        user.isMustChangePassword(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }
}
