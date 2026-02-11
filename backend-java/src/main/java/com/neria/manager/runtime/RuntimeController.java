package com.neria.manager.runtime;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/runtime")
public class RuntimeController {
  private final RuntimeService runtimeService;

  public RuntimeController(RuntimeService runtimeService) {
    this.runtimeService = runtimeService;
  }

  @PostMapping("/execute")
  public Object execute(HttpServletRequest request, @RequestBody ExecuteRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return runtimeService.execute(tenantId, dto);
  }
}
