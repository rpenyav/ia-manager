import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantServicesDto {
  @IsOptional()
  @IsBoolean()
  genericEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  ocrEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sqlEnabled?: boolean;
}
