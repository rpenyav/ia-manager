import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateChatUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 128)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;
}
