import { IsEmail, IsString, Length } from 'class-validator';

export class LoginChatUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 128)
  password!: string;
}
