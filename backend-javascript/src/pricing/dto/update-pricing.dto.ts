import { IsBoolean, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdatePricingDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  providerType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  model?: string;

  @IsOptional()
  @IsNumber()
  inputCostPer1k?: number;

  @IsOptional()
  @IsNumber()
  outputCostPer1k?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
