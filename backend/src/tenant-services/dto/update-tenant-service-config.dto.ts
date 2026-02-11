import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { TenantServiceStatus } from '../../common/entities/tenant-service-config.entity';

export class UpdateTenantServiceConfigDto {
  @IsOptional()
  @IsString()
  @IsIn(['active', 'suspended'])
  status?: TenantServiceStatus;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  systemPrompt?: string;
}
