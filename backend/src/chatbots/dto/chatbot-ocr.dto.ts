import { IsOptional, IsString } from 'class-validator';

export class ChatbotOcrDto {
  @IsString()
  providerId!: string;

  @IsString()
  model!: string;

  @IsString()
  documentId!: string;

  @IsString()
  question!: string;

  @IsOptional()
  requestId?: string;
}
