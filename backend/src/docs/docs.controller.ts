import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CreateDocDto } from './dto/create-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import { DocsService } from './docs.service';

@Controller('docs')
@UseGuards(AuthGuard)
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  list(
    @Query('menuSlug') menuSlug?: string,
    @Query('category') category?: string,
    @Query('enabled') enabled?: string,
    @Query('q') q?: string
  ) {
    const enabledBool =
      enabled === undefined ? undefined : enabled === 'true' || enabled === '1';
    return this.docsService.list({ menuSlug, category, enabled: enabledBool, search: q });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.docsService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateDocDto) {
    return this.docsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.docsService.remove(id);
  }
}
