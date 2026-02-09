import { IsArray, IsOptional, IsString } from 'class-validator';

export class ChatbotGenericDto {
  @IsString()
  providerId!: string;

  @IsString()
  model!: string;

  @IsArray()
  messages!: Array<{ role: string; content: string }>;

  @IsOptional()
  requestId?: string;
}
