import { IsIn, IsString } from 'class-validator';
import { TenantServiceUserStatus } from '../../common/entities/tenant-service-user.entity';

export class UpdateTenantServiceUserDto {
  @IsString()
  @IsIn(['active', 'suspended'])
  status!: TenantServiceUserStatus;
}
