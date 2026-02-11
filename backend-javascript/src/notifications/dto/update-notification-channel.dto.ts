import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateNotificationChannelDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 16)
  type?: 'email' | 'slack';

  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
