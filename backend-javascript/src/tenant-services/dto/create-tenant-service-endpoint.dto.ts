import { IsBoolean, IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateTenantServiceEndpointDto {
  @IsString()
  @Length(1, 64)
  slug!: string;

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method!: string;

  @IsString()
  @Length(1, 255)
  path!: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  baseUrl?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
