import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentationEntry } from '../common/entities/documentation-entry.entity';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { DocsSeedService } from './docs-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentationEntry])],
  controllers: [DocsController],
  providers: [DocsService, DocsSeedService],
  exports: [DocsService]
})
export class DocsModule {}
