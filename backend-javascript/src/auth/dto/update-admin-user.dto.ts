import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['admin', 'editor'])
  role?: 'admin' | 'editor';

  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';

  @IsOptional()
  @IsString()
  @Length(6, 128)
  password?: string;
}
