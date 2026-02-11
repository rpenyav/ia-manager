import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsArray()
  events?: string[];

  @IsOptional()
  @IsString()
  @Length(0, 255)
  secret?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
