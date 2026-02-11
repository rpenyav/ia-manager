import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @Length(2, 120)
  username!: string;

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

  @IsString()
  @Length(6, 128)
  password!: string;
}
