package com.neria.manager.chat;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ChatTokenService {
  private final Key key;
  private final long ttlSeconds;

  public ChatTokenService() {
    String secret = System.getenv().getOrDefault("CHAT_JWT_SECRET", "dev_chat_jwt_secret_change_me");
    if (secret.length() < 32) {
      throw new IllegalArgumentException("CHAT_JWT_SECRET must be at least 32 characters");
    }
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.ttlSeconds = Long.parseLong(System.getenv().getOrDefault("CHAT_JWT_TTL", "7200"));
  }

  public String sign(Map<String, Object> claims) {
    Instant now = Instant.now();
    return Jwts.builder()
        .setClaims(claims)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims verify(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
  }

  public long getTtlSeconds() {
    return ttlSeconds;
  }
}
