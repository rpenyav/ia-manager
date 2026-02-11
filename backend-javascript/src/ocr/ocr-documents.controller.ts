import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateOcrDocumentDto } from './dto/create-ocr-document.dto';
import { UpdateOcrDocumentDto } from './dto/update-ocr-document.dto';
import { OcrDocumentsService } from './ocr-documents.service';

@Controller('ocr-documents')
@UseGuards(AuthGuard, TenantGuard)
export class OcrDocumentsController {
  constructor(private readonly ocrDocumentsService: OcrDocumentsService) {}

  @Get()
  list(@Req() request: Request & { tenantId: string }) {
    return this.ocrDocumentsService.list(request.tenantId);
  }

  @Post()
  create(@Req() request: Request & { tenantId: string }, @Body() dto: CreateOcrDocumentDto) {
    return this.ocrDocumentsService.create(request.tenantId, dto);
  }

  @Patch(':id')
  update(
    @Req() request: Request & { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdateOcrDocumentDto
  ) {
    return this.ocrDocumentsService.update(request.tenantId, id, dto);
  }
}
