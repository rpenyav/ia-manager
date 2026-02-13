package com.neria.manager.common.security;

import com.neria.manager.auth.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(AuthFilter.class);
  private final AuthService authService;

  public AuthFilter(AuthService authService) {
    this.authService = authService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    boolean debugAuth =
        "true".equalsIgnoreCase(System.getenv().getOrDefault("AUTH_DEBUG", ""))
            || "local".equalsIgnoreCase(System.getenv().getOrDefault("APP_ENV", ""));
    String debugDetail = null;
    if (path.startsWith("/auth/login")
        || path.startsWith("/auth/token")
        || path.startsWith("/auth/forgot-password")
        || path.startsWith("/auth/reset-password")
        || path.startsWith("/actuator/health")
        || path.startsWith("/actuator/info")
        || path.startsWith("/billing/confirm")
        || path.startsWith("/billing/stripe/confirm")) {
      filterChain.doFilter(request, response);
      return;
    }

    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
    String apiKey = request.getHeader("x-api-key");
    String cookieToken = extractCookie(request, "pm_auth_token");

    boolean attempted = false;

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      attempted = true;
      String token = authHeader.substring("Bearer ".length());
      AuthContext context = null;
      try {
        context = authService.validateJwt(token);
      } catch (Exception ex) {
        log.warn(
            "JWT header invalid for {} (len={}, type={}, message={})",
            path,
            token != null ? token.length() : 0,
            ex.getClass().getSimpleName(),
            ex.getMessage());
        if (debugAuth) {
          debugDetail = "jwt_header:" + ex.getClass().getSimpleName();
        }
        // Fall through to try cookie/api key.
      }
      if (context != null) {
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }
    }

    if (cookieToken != null && !cookieToken.isBlank()) {
      attempted = true;
      AuthContext context = null;
      try {
        context = authService.validateJwt(cookieToken);
      } catch (Exception ex) {
        log.warn(
            "JWT cookie invalid for {} (len={}, type={}, message={})",
            path,
            cookieToken != null ? cookieToken.length() : 0,
            ex.getClass().getSimpleName(),
            ex.getMessage());
        if (debugAuth) {
          debugDetail = "jwt_cookie:" + ex.getClass().getSimpleName();
        }
        // Fall through to try api key.
      }
      if (context != null) {
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }
    }

    if (apiKey != null && !apiKey.isBlank()) {
      attempted = true;
      AuthContext context = null;
      try {
        context = authService.validateApiKey(apiKey);
      } catch (Exception ex) {
        log.warn(
            "API key invalid for {} (len={}, type={}, message={})",
            path,
            apiKey != null ? apiKey.length() : 0,
            ex.getClass().getSimpleName(),
            ex.getMessage());
        if (debugAuth) {
          debugDetail = "api_key:" + ex.getClass().getSimpleName();
        }
        // Will return unauthorized below.
      }
      if (context != null) {
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }
    }

    if (attempted) {
      log.warn(
          "Invalid credentials for {} (authHeader={}, apiKey={}, cookieToken={})",
          path,
          authHeader != null,
          apiKey != null,
          cookieToken != null);
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      response
          .getWriter()
          .write(
              "{\"message\":\"Invalid credentials\",\"error\":\"Unauthorized\""
                  + (debugAuth && debugDetail != null
                      ? ",\"detail\":\"" + jsonEscape(debugDetail) + "\""
                      : "")
                  + "}");
      return;
    }

    log.warn(
        "Missing credentials for {} (authHeader={}, apiKey={}, cookieToken={})",
        path,
        authHeader != null,
        apiKey != null,
        cookieToken != null);
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response
        .getWriter()
        .write(
            "{\"message\":\"Missing credentials\",\"error\":\"Unauthorized\""
                + (debugAuth ? ",\"detail\":\"missing\"" : "")
                + "}");
  }

  private String extractCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    Optional<Cookie> match =
        Arrays.stream(cookies).filter(cookie -> name.equals(cookie.getName())).findFirst();
    return match.map(Cookie::getValue).orElse(null);
  }

  private String jsonEscape(String value) {
    if (value == null) {
      return "";
    }
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
