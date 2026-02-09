import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrDocument } from '../common/entities/ocr-document.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { OcrDocumentsController } from './ocr-documents.controller';
import { OcrDocumentsService } from './ocr-documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([OcrDocument])],
  controllers: [OcrDocumentsController],
  providers: [OcrDocumentsService, EncryptionService],
  exports: [OcrDocumentsService]
})
export class OcrDocumentsModule {}
