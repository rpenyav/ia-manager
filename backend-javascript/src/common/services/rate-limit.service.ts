import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class RateLimitService {
  private readonly limiters = new Map<number, RateLimiterMemory | RateLimiterRedis>();
  private readonly redis?: Redis;

  constructor(private readonly configService: ConfigService) {
    const enabled = (this.configService.get<string>('CACHE_REDIS_ENABLED') ?? 'true') === 'true';
    const host = this.configService.get<string>('CACHE_REDIS_HOST');
    if (enabled && host) {
      this.redis = new Redis({
        host,
        port: Number(this.configService.get<string>('CACHE_REDIS_PORT') || 6379),
        password: this.configService.get<string>('CACHE_REDIS_PASSWORD') || undefined,
        db: Number(this.configService.get<string>('CACHE_REDIS_DB') || 1)
      });
    }
  }

  private getLimiter(maxRequestsPerMinute: number) {
    const rpm = Math.max(1, maxRequestsPerMinute);
    const existing = this.limiters.get(rpm);
    if (existing) {
      return existing;
    }

    const limiter = this.redis
      ? new RateLimiterRedis({
          storeClient: this.redis,
          points: rpm,
          duration: 60
        })
      : new RateLimiterMemory({ points: rpm, duration: 60 });

    this.limiters.set(rpm, limiter);
    return limiter;
  }

  async consume(tenantId: string, maxRequestsPerMinute: number) {
    const limiter = this.getLimiter(maxRequestsPerMinute);
    try {
      const result = await limiter.consume(tenantId);
      return result;
    } catch (error) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
