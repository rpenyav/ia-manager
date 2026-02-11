package com.neria.manager.auth;

import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/users")
public class AdminUsersController {
  private final AdminUsersService adminUsersService;

  public AdminUsersController(AdminUsersService adminUsersService) {
    this.adminUsersService = adminUsersService;
  }

  @GetMapping
  public List<AdminUsersService.AdminUserView> list(HttpServletRequest request) {
    requireAdmin(request);
    return adminUsersService.list();
  }

  @PostMapping
  public AdminUsersService.AdminUserView create(
      HttpServletRequest request, @RequestBody AdminUsersService.CreateAdminUserRequest dto) {
    requireAdmin(request);
    return adminUsersService.create(dto);
  }

  @PatchMapping("/{id}")
  public AdminUsersService.AdminUserView update(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @RequestBody AdminUsersService.UpdateAdminUserRequest dto) {
    requireAdmin(request);
    return adminUsersService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> remove(HttpServletRequest request, @PathVariable("id") String id) {
    AuthContext auth = requireAdmin(request);
    adminUsersService.remove(id, auth.getSub());
    return ResponseEntity.ok(Map.of("ok", true));
  }

  private AuthContext requireAdmin(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
    return auth;
  }
}
