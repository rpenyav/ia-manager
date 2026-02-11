import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { TenantServiceUserStatus } from '../../common/entities/tenant-service-user.entity';

export class AssignTenantServiceUserDto {
  @IsString()
  @Length(2, 36)
  userId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'suspended'])
  status?: TenantServiceUserStatus;
}
