import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { DemoSeedService } from './demo-seed.service';

@Controller('seed')
@UseGuards(AuthGuard)
export class SeedController {
  constructor(private readonly demoSeedService: DemoSeedService) {}

  @Post('demo')
  async seedDemo() {
    return this.demoSeedService.run();
  }
}
