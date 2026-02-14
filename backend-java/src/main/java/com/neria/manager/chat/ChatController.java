package com.neria.manager.chat;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/chat")
public class ChatController {
  private final ChatService chatService;
  private final ChatAuthService chatAuthService;

  public ChatController(ChatService chatService, ChatAuthService chatAuthService) {
    this.chatService = chatService;
    this.chatAuthService = chatAuthService;
  }

  private Claims requireChatToken(HttpServletRequest request, String tenantId) {
    String token = request.getHeader("x-chat-token");
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing chat token");
    }
    Claims claims = chatAuthService.validateToken(token);
    Object tokenTenant = claims.get("tenantId");
    if (tokenTenant != null && !tenantId.equals(String.valueOf(tokenTenant))) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant mismatch");
    }
    return claims;
  }

  private String requireUserId(Claims claims) {
    String userId = claims.getSubject();
    if (userId == null || userId.isBlank()) {
      Object raw = claims.get("sub");
      userId = raw != null ? String.valueOf(raw) : null;
    }
    if (userId == null || userId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing chat user");
    }
    return userId;
  }

  private String resolveTenantId(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    return AuthUtils.resolveTenantId(auth, request);
  }

  @GetMapping("/conversations")
  public Object listConversations(HttpServletRequest request) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listConversations(tenantId, userId);
  }

  @GetMapping("/services")
  public Object listServices(HttpServletRequest request) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listUserServices(tenantId, userId);
  }

  @GetMapping("/services/{serviceCode}/endpoints")
  public Object listServiceEndpoints(
      HttpServletRequest request, @PathVariable String serviceCode) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listServiceEndpoints(tenantId, userId, serviceCode);
  }

  @PostMapping("/conversations")
  public Object createConversation(
      HttpServletRequest request, @RequestBody ChatService.CreateConversationRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    AuthContext auth = AuthUtils.requireAuth(request);
    String apiKeyId = auth.getApiKeyId();
    return chatService.createConversation(tenantId, userId, apiKeyId, dto);
  }

  @GetMapping("/conversations/{id}/messages")
  public Object listMessages(HttpServletRequest request, @PathVariable String id) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listMessagesForUser(tenantId, userId, id);
  }

  @PostMapping("/conversations/{id}/messages")
  public Object addMessage(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ChatService.CreateMessageRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    AuthContext auth = AuthUtils.requireAuth(request);
    String apiKeyId = auth.getApiKeyId();
    return chatService.addMessage(tenantId, userId, apiKeyId, id, dto);
  }
}
