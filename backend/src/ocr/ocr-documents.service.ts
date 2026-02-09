import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OcrDocument } from '../common/entities/ocr-document.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { CreateOcrDocumentDto } from './dto/create-ocr-document.dto';
import { UpdateOcrDocumentDto } from './dto/update-ocr-document.dto';

@Injectable()
export class OcrDocumentsService {
  constructor(
    @InjectRepository(OcrDocument)
    private readonly documentsRepository: Repository<OcrDocument>,
    private readonly encryptionService: EncryptionService
  ) {}

  async list(tenantId: string) {
    return this.documentsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });
  }

  async create(tenantId: string, dto: CreateOcrDocumentDto) {
    const doc = this.documentsRepository.create({
      tenantId,
      title: dto.title,
      source: dto.source ?? null,
      encryptedContent: this.encryptionService.encrypt(dto.content),
      metadata: dto.metadata ?? {},
      enabled: dto.enabled ?? true
    });
    return this.documentsRepository.save(doc);
  }

  async update(tenantId: string, id: string, dto: UpdateOcrDocumentDto) {
    const doc = await this.documentsRepository.findOne({ where: { id, tenantId } });
    if (!doc) {
      throw new NotFoundException('OCR document not found');
    }

    if (dto.title !== undefined) {
      doc.title = dto.title;
    }
    if (dto.source !== undefined) {
      doc.source = dto.source;
    }
    if (dto.content !== undefined) {
      doc.encryptedContent = this.encryptionService.encrypt(dto.content);
    }
    if (dto.metadata !== undefined) {
      doc.metadata = dto.metadata;
    }
    if (dto.enabled !== undefined) {
      doc.enabled = dto.enabled;
    }

    return this.documentsRepository.save(doc);
  }

  async getById(tenantId: string, id: string) {
    const doc = await this.documentsRepository.findOne({ where: { id, tenantId } });
    if (!doc) {
      throw new NotFoundException('OCR document not found');
    }
    return doc;
  }

  async getDecryptedContent(doc: OcrDocument) {
    return this.encryptionService.decrypt(doc.encryptedContent);
  }
}
