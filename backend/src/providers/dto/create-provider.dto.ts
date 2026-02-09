import { IsBoolean, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateProviderDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  type?: string;

  @IsString()
  @Length(2, 255)
  displayName!: string;

  @IsString()
  credentials!: string;

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
