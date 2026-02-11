package com.neria.manager.common.services;

import com.neria.manager.config.AppProperties;
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
public class JwtService {
  private final Key key;
  private final long ttlSeconds;

  public JwtService(AppProperties properties) {
    String secret = properties.getJwt().getSecret();
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.ttlSeconds = properties.getJwt().getTtl();
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
