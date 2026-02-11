package com.neria.manager.chatbots;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chatbots")
public class ChatbotsController {
  private final ChatbotsService chatbotsService;

  public ChatbotsController(ChatbotsService chatbotsService) {
    this.chatbotsService = chatbotsService;
  }

  private String resolveTenantId(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    return AuthUtils.resolveTenantId(auth, request);
  }

  @PostMapping("/generic")
  public Object generic(
      HttpServletRequest request, @RequestBody ChatbotsService.ChatbotGenericRequest dto) {
    return chatbotsService.generic(resolveTenantId(request), dto);
  }

  @PostMapping("/ocr")
  public Object ocr(
      HttpServletRequest request, @RequestBody ChatbotsService.ChatbotOcrRequest dto) {
    return chatbotsService.ocr(resolveTenantId(request), dto);
  }

  @PostMapping("/sql")
  public Object sql(
      HttpServletRequest request, @RequestBody ChatbotsService.ChatbotSqlRequest dto) {
    return chatbotsService.sql(resolveTenantId(request), dto);
  }
}
