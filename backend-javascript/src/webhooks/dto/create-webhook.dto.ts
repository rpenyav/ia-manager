import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateWebhookDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsUrl()
  url!: string;

  @IsArray()
  events!: string[];

  @IsOptional()
  @IsString()
  @Length(0, 255)
  secret?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
