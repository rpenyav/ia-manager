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

    try {
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring("Bearer ".length());
        AuthContext context = authService.validateJwt(token);
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }

      if (cookieToken != null && !cookieToken.isBlank()) {
        AuthContext context = authService.validateJwt(cookieToken);
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }

      if (apiKey != null && !apiKey.isBlank()) {
        AuthContext context = authService.validateApiKey(apiKey);
        request.setAttribute("auth", context);
        filterChain.doFilter(request, response);
        return;
      }
    } catch (Exception ex) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json");
      response
          .getWriter()
          .write("{\"message\":\"Invalid credentials\",\"error\":\"Unauthorized\"}");
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
    response.getWriter().write("{\"message\":\"Missing credentials\",\"error\":\"Unauthorized\"}");
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
}
