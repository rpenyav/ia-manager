package com.neria.manager.chat;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat/auth")
public class ChatAuthController {
  private final ChatAuthService chatAuthService;

  public ChatAuthController(ChatAuthService chatAuthService) {
    this.chatAuthService = chatAuthService;
  }

  @PostMapping("/register")
  public Object register(
      HttpServletRequest request, @RequestBody ChatAuthService.RegisterChatUserRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return chatAuthService.register(tenantId, dto);
  }

  @PostMapping("/login")
  public Object login(
      HttpServletRequest request, @RequestBody ChatAuthService.LoginChatUserRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return chatAuthService.login(tenantId, dto);
  }
}
