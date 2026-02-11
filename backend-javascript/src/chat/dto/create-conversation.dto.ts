import { IsOptional, IsString, Length } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @Length(2, 64)
  serviceCode!: string;

  @IsString()
  @Length(2, 64)
  providerId!: string;

  @IsString()
  @Length(1, 128)
  model!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  systemPrompt?: string;
}
