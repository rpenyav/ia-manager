package com.neria.manager.chat;

import com.neria.manager.common.entities.ChatUser;
import com.neria.manager.common.repos.ChatUserRepository;
import com.neria.manager.common.services.ScryptHasher;
import io.jsonwebtoken.Claims;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChatAuthService {
  private final ChatUserRepository chatUserRepository;
  private final ScryptHasher scryptHasher;
  private final ChatTokenService tokenService;
  private final String salt;

  public ChatAuthService(
      ChatUserRepository chatUserRepository, ScryptHasher scryptHasher, ChatTokenService tokenService) {
    this.chatUserRepository = chatUserRepository;
    this.scryptHasher = scryptHasher;
    this.tokenService = tokenService;
    String envSalt = System.getenv().getOrDefault("CHAT_PASSWORD_SALT", "");
    if (envSalt.length() < 16) {
      throw new IllegalArgumentException("CHAT_PASSWORD_SALT must be at least 16 characters");
    }
    this.salt = envSalt;
  }

  public String hashPassword(String value) {
    return scryptHasher.hash(value, salt);
  }

  private boolean matches(String value, String hash) {
    return scryptHasher.matches(value, salt, hash);
  }

  public Map<String, Object> register(String tenantId, RegisterChatUserRequest dto) {
    String email = dto.email == null ? "" : dto.email.trim().toLowerCase();
    if (email.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");
    }
    chatUserRepository.findByTenantIdAndEmail(tenantId, email).ifPresent(existing -> {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email already registered");
    });

    ChatUser user = new ChatUser();
    user.setId(UUID.randomUUID().toString());
    user.setTenantId(tenantId);
    user.setEmail(email);
    user.setName(dto.name != null ? dto.name.trim() : null);
    user.setPasswordHash(hashPassword(dto.password));
    user.setStatus("active");
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    chatUserRepository.save(user);
    return issueToken(user);
  }

  public Map<String, Object> login(String tenantId, LoginChatUserRequest dto) {
    String email = dto.email == null ? "" : dto.email.trim().toLowerCase();
    ChatUser user =
        chatUserRepository
            .findByTenantIdAndEmail(tenantId, email)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!"active".equals(user.getStatus())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    if (!matches(dto.password, user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    return issueToken(user);
  }

  public Map<String, Object> issueToken(ChatUser user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("sub", user.getId());
    claims.put("tenantId", user.getTenantId());
    claims.put("email", user.getEmail());
    String token = tokenService.sign(claims);
    Map<String, Object> userView =
        Map.of(
            "id", user.getId(),
            "tenantId", user.getTenantId(),
            "email", user.getEmail(),
            "name", user.getName(),
            "status", user.getStatus());
    return Map.of("accessToken", token, "user", userView);
  }

  public Claims validateToken(String token) {
    try {
      return tokenService.verify(token);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid chat token");
    }
  }

  public ChatUser getUserById(String id) {
    return chatUserRepository.findById(id).orElse(null);
  }

  public static class RegisterChatUserRequest {
    public String email;
    public String name;
    public String password;
  }

  public static class LoginChatUserRequest {
    public String email;
    public String password;
  }
}
