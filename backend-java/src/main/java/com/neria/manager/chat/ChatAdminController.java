package com.neria.manager.chat;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/chat")
public class ChatAdminController {
  private final ChatService chatService;

  public ChatAdminController(ChatService chatService) {
    this.chatService = chatService;
  }

  private void requireTenantScope(HttpServletRequest request, String tenantId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
  }

  @GetMapping("/users")
  public Object listUsers(HttpServletRequest request, @PathVariable String tenantId) {
    requireTenantScope(request, tenantId);
    return chatService.adminListUsers(tenantId);
  }

  @PostMapping("/users")
  public Object createUser(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @RequestBody ChatService.CreateChatUserRequest dto) {
    requireTenantScope(request, tenantId);
    return chatService.adminCreateUser(tenantId, dto);
  }

  @PatchMapping("/users/{id}")
  public Object updateUser(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String id,
      @RequestBody ChatService.UpdateChatUserRequest dto) {
    requireTenantScope(request, tenantId);
    return chatService.adminUpdateUser(tenantId, id, dto);
  }

  @DeleteMapping("/users/{id}")
  public Object deleteUser(
      HttpServletRequest request, @PathVariable String tenantId, @PathVariable String id) {
    requireTenantScope(request, tenantId);
    return chatService.adminDeleteUser(tenantId, id);
  }

  @GetMapping("/conversations")
  public Object listConversations(HttpServletRequest request, @PathVariable String tenantId) {
    requireTenantScope(request, tenantId);
    return chatService.adminListConversations(tenantId);
  }

  @GetMapping("/conversations/{id}/messages")
  public Object listMessages(
      HttpServletRequest request, @PathVariable String tenantId, @PathVariable String id) {
    requireTenantScope(request, tenantId);
    return chatService.adminListMessages(tenantId, id);
  }

  @DeleteMapping("/conversations/{id}")
  public Object deleteConversation(
      HttpServletRequest request, @PathVariable String tenantId, @PathVariable String id) {
    requireTenantScope(request, tenantId);
    return chatService.adminDeleteConversation(tenantId, id);
  }
}
