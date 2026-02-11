package com.neria.manager.common.services;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RateLimitService {
  private static class Bucket {
    int count;
    long windowStart;

    Bucket(int count, long windowStart) {
      this.count = count;
      this.windowStart = windowStart;
    }
  }

  private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

  public void consume(String key, int maxRequestsPerMinute) {
    int limit = Math.max(1, maxRequestsPerMinute);
    long now = Instant.now().toEpochMilli();
    long windowMs = 60_000L;

    Bucket bucket = buckets.compute(
        key,
        (k, existing) -> {
          if (existing == null || now - existing.windowStart >= windowMs) {
            return new Bucket(1, now);
          }
          existing.count += 1;
          return existing;
        });

    if (bucket.count > limit) {
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
    }
  }
}
