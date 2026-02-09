import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ChatbotGenericDto } from './dto/chatbot-generic.dto';
import { ChatbotOcrDto } from './dto/chatbot-ocr.dto';
import { ChatbotSqlDto } from './dto/chatbot-sql.dto';
import { ChatbotsService } from './chatbots.service';

@Controller('chatbots')
@UseGuards(AuthGuard, TenantGuard)
export class ChatbotsController {
  constructor(private readonly chatbotsService: ChatbotsService) {}

  @Post('generic')
  generic(@Req() request: Request & { tenantId: string }, @Body() dto: ChatbotGenericDto) {
    return this.chatbotsService.generic(request.tenantId, dto);
  }

  @Post('ocr')
  ocr(@Req() request: Request & { tenantId: string }, @Body() dto: ChatbotOcrDto) {
    return this.chatbotsService.ocr(request.tenantId, dto);
  }

  @Post('sql')
  sql(@Req() request: Request & { tenantId: string }, @Body() dto: ChatbotSqlDto) {
    return this.chatbotsService.sql(request.tenantId, dto);
  }
}
