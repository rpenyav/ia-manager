package com.neria.manager.auth;

import com.neria.manager.common.entities.AdminUser;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.services.EmailService;
import com.neria.manager.config.AppProperties;
import com.neria.manager.tenants.TenantsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;
  private final AdminUsersService adminUsersService;
  private final AdminPasswordResetService resetService;
  private final EmailService emailService;
  private final TenantAuthService tenantAuthService;
  private final TenantsService tenantsService;
  private final AppProperties properties;

  public AuthController(
      AuthService authService,
      AdminUsersService adminUsersService,
      AdminPasswordResetService resetService,
      EmailService emailService,
      TenantAuthService tenantAuthService,
      TenantsService tenantsService,
      AppProperties properties) {
    this.authService = authService;
    this.adminUsersService = adminUsersService;
    this.resetService = resetService;
    this.emailService = emailService;
    this.tenantAuthService = tenantAuthService;
    this.tenantsService = tenantsService;
    this.properties = properties;
  }

  @PostMapping("/token")
  public ResponseEntity<AuthService.TokenResult> token(
      @RequestBody Map<String, String> body, HttpServletResponse response) {
    String clientId = body.getOrDefault("clientId", "");
    String clientSecret = body.getOrDefault("clientSecret", "");
    AuthService.TokenResult issued = authService.issueToken(clientId, clientSecret);
    adminUsersService.getOrCreate(clientId, clientSecret);
    setAuthCookies(response, issued.accessToken(), clientId);
    return ResponseEntity.ok(issued);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletResponse response) {
    String username = body.getOrDefault("username", "");
    String password = body.getOrDefault("password", "");
    AdminUser user = null;
    Tenant tenant = null;

    try {
      user = adminUsersService.validateCredentials(username, password);
    } catch (Exception ex) {
      String bootstrapUser = properties.getAuth().getAdminClientId();
      String bootstrapPass = properties.getAuth().getAdminClientSecret();
      if (username.equals(bootstrapUser) && password.equals(bootstrapPass)) {
        user = adminUsersService.getOrCreate(bootstrapUser, bootstrapPass);
      } else {
        try {
          tenant = tenantAuthService.validateCredentials(username, password);
        } catch (Exception ignore) {
          // keep null
        }
      }
    }

    if (tenant == null && user == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    AuthService.TokenResult issued =
        tenant != null
            ? authService.issueTenantToken(tenant.getId(), tenant.getAuthUsername())
            : authService.issueAdminToken(user.getUsername(), user.getRole());

    String userLabel = tenant != null ? tenant.getAuthUsername() : user.getUsername();
    setAuthCookies(response, issued.accessToken(), userLabel);

    boolean mustChange =
        tenant != null ? tenant.isAuthMustChangePassword() : user.isMustChangePassword();
    return ResponseEntity.ok(
        Map.of(
            "accessToken",
            issued.accessToken(),
            "expiresIn",
            issued.expiresIn(),
            "mustChangePassword",
            mustChange));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
    int ttl = Integer.parseInt(System.getenv().getOrDefault("ADMIN_RESET_TOKEN_TTL_MINUTES", "30"));
    AdminPasswordResetService.ResetResult result =
        resetService.createReset(body.getOrDefault("identifier", ""), ttl);
    if (result != null && result.user().getEmail() != null) {
      String frontendUrl = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:5173");
      String resetUrl = frontendUrl + "/reset-password?token=" + result.token();
      emailService.sendPasswordReset(result.user().getEmail(), resetUrl);
    }
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
    String userId = resetService.consumeReset(body.getOrDefault("token", ""));
    adminUsersService.setPasswordById(userId, body.getOrDefault("password", ""));
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/session")
  public ResponseEntity<?> session(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("user", null, "role", null));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      Tenant tenant = tenantsService.getById(auth.getTenantId());
      return ResponseEntity.ok(
          Map.of(
              "user",
              tenant != null && tenant.getAuthUsername() != null
                  ? tenant.getAuthUsername()
                  : auth.getSub(),
              "role",
              "tenant",
              "name",
              tenant != null ? tenant.getName() : null,
              "email",
              tenant != null ? tenant.getBillingEmail() : null,
              "tenantId",
              auth.getTenantId(),
              "status",
              tenant != null ? tenant.getStatus() : null,
              "language",
              tenant != null ? tenant.getLanguage() : null,
              "mustChangePassword",
              tenant != null && tenant.isAuthMustChangePassword()));
    }

    AdminUser profile = adminUsersService.getOrCreate(auth.getSub());
    return ResponseEntity.ok(
        Map.of(
            "user",
            profile.getUsername(),
            "role",
            profile.getRole(),
            "name",
            profile.getName(),
            "email",
            profile.getEmail(),
            "status",
            profile.getStatus(),
            "language",
            profile.getLanguage(),
            "mustChangePassword",
            profile.isMustChangePassword()));
  }

  @GetMapping("/profile")
  public ResponseEntity<?> profile(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      Tenant tenant = tenantsService.getById(auth.getTenantId());
      return ResponseEntity.ok(
          Map.of(
              "id",
              tenant != null ? tenant.getId() : null,
              "username",
              tenant != null ? tenant.getAuthUsername() : auth.getSub(),
              "name",
              tenant != null ? tenant.getName() : null,
              "email",
              tenant != null ? tenant.getBillingEmail() : null,
              "role",
              "tenant",
              "status",
              tenant != null ? tenant.getStatus() : null,
              "language",
              tenant != null ? tenant.getLanguage() : null,
              "mustChangePassword",
              tenant != null && tenant.isAuthMustChangePassword(),
              "createdAt",
              tenant != null ? tenant.getCreatedAt() : null,
              "updatedAt",
              tenant != null ? tenant.getUpdatedAt() : null));
    }
    AdminUser profile = adminUsersService.getOrCreate(auth.getSub());
    return ResponseEntity.ok(
        Map.of(
            "id",
            profile.getId(),
            "username",
            profile.getUsername(),
            "name",
            profile.getName(),
            "email",
            profile.getEmail(),
            "role",
            profile.getRole(),
            "status",
            profile.getStatus(),
            "language",
            profile.getLanguage(),
            "mustChangePassword",
            profile.isMustChangePassword(),
            "createdAt",
            profile.getCreatedAt(),
            "updatedAt",
            profile.getUpdatedAt()));
  }

  @PatchMapping("/profile")
  public ResponseEntity<?> updateProfile(
      HttpServletRequest request, @RequestBody Map<String, String> body) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      String name = body.get("name");
      String email = body.get("email");
      String password = body.get("password");
      String language = body.get("language");
      TenantsService.UpdateTenantSelfRequest dto = new TenantsService.UpdateTenantSelfRequest();
      dto.name = name;
      dto.billingEmail = email;
      dto.authPassword = password;
      dto.language = language;
      tenantsService.updateSelf(auth.getTenantId(), dto);
      return profile(request);
    }
    AdminUsersService.UpdateProfileRequest dto =
        new AdminUsersService.UpdateProfileRequest(
            body.get("name"), body.get("email"), body.get("password"), body.get("language"));
    AdminUser updated = adminUsersService.updateProfile(auth.getSub(), dto);
    return ResponseEntity.ok(
        Map.of(
            "id",
            updated.getId(),
            "username",
            updated.getUsername(),
            "name",
            updated.getName(),
            "email",
            updated.getEmail(),
            "role",
            updated.getRole(),
            "status",
            updated.getStatus(),
            "mustChangePassword",
            updated.isMustChangePassword()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse response) {
    clearCookie(response, "pm_auth_token");
    clearCookie(response, "pm_auth_user");
    clearCookie(response, "pm_auth_name");
    return ResponseEntity.ok(Map.of("ok", true));
  }

  private void setAuthCookies(HttpServletResponse response, String token, String user) {
    int maxAge = (int) Duration.ofSeconds(properties.getJwt().getTtl()).toSeconds();
    addCookie(response, "pm_auth_token", token, true, maxAge);
    addCookie(response, "pm_auth_user", user, false, maxAge);
  }

  private void clearCookie(HttpServletResponse response, String name) {
    addCookie(response, name, "", false, 0);
  }

  private void addCookie(
      HttpServletResponse response, String name, String value, boolean httpOnly, int maxAge) {
    String sameSite = properties.getCookies().getSameSite();
    if (sameSite == null || sameSite.isBlank()) {
      sameSite = "Lax";
    } else if ("none".equalsIgnoreCase(sameSite)) {
      sameSite = "None";
    } else if ("strict".equalsIgnoreCase(sameSite)) {
      sameSite = "Strict";
    } else {
      sameSite = "Lax";
    }
    boolean secure = properties.getCookies().isSecure() || "None".equalsIgnoreCase(sameSite);
    ResponseCookie cookie =
        ResponseCookie.from(name, value)
            .httpOnly(httpOnly)
            .secure(secure)
            .sameSite(sameSite)
            .path("/")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
