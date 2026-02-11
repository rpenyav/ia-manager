package com.neria.manager.notifications;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationsController {
  private final NotificationsService service;

  public NotificationsController(NotificationsService service) {
    this.service = service;
  }

  @GetMapping
  public Object list(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return service.list();
  }

  @PostMapping
  public Object create(
      HttpServletRequest request, @RequestBody NotificationsService.CreateChannelRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return service.create(dto);
  }

  @PatchMapping("/{id}")
  public Object update(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody NotificationsService.UpdateChannelRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return service.update(id, dto);
  }
}
