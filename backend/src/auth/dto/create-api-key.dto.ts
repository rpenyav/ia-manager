import { IsOptional, IsString, Length } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}
