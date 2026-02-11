import { IsArray, IsString } from 'class-validator';

export class UpdateTenantPricingDto {
  @IsArray()
  @IsString({ each: true })
  pricingIds!: string[];
}
