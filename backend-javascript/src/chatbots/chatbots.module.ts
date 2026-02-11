import { Module } from '@nestjs/common';
import { ChatbotsController } from './chatbots.controller';
import { ChatbotsService } from './chatbots.service';
import { RuntimeModule } from '../runtime/runtime.module';
import { OcrDocumentsModule } from '../ocr/ocr-documents.module';
import { DbConnectionsModule } from '../db-connections/db-connections.module';

@Module({
  imports: [RuntimeModule, OcrDocumentsModule, DbConnectionsModule],
  controllers: [ChatbotsController],
  providers: [ChatbotsService]
})
export class ChatbotsModule {}
