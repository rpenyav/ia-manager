import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(AuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  list() {
    return this.pricingService.list();
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() dto: CreatePricingDto) {
    return this.pricingService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePricingDto) {
    return this.pricingService.update(id, dto);
  }
}
