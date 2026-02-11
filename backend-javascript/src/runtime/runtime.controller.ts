import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import { RuntimeService } from './runtime.service';

@Controller('runtime')
@UseGuards(AuthGuard, TenantGuard)
export class RuntimeController {
  constructor(private readonly runtimeService: RuntimeService) {}

  @Post('execute')
  execute(@Req() request: Request & { tenantId: string }, @Body() dto: ExecuteRequestDto) {
    return this.runtimeService.execute(request.tenantId, dto);
  }
}
