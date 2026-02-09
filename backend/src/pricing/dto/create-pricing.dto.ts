import { IsBoolean, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreatePricingDto {
  @IsString()
  @Length(2, 64)
  providerType!: string;

  @IsString()
  @Length(1, 128)
  model!: string;

  @IsNumber()
  inputCostPer1k!: number;

  @IsNumber()
  outputCostPer1k!: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
