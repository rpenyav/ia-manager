import { IsBoolean, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  displayName?: string;

  @IsOptional()
  @IsString()
  credentials?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
