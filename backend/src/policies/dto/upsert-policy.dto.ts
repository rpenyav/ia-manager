import { IsBoolean, IsNumber, IsObject, IsOptional } from 'class-validator';

export class UpsertPolicyDto {
  @IsOptional()
  @IsNumber()
  maxRequestsPerMinute?: number;

  @IsOptional()
  @IsNumber()
  maxTokensPerDay?: number;

  @IsOptional()
  @IsNumber()
  maxCostPerDayUsd?: number;

  @IsOptional()
  @IsBoolean()
  redactionEnabled?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
