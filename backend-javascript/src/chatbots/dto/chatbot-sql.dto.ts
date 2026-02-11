import { IsOptional, IsString } from 'class-validator';

export class ChatbotSqlDto {
  @IsString()
  providerId!: string;

  @IsString()
  model!: string;

  @IsString()
  connectionId!: string;

  @IsString()
  question!: string;

  @IsOptional()
  sql?: string;

  @IsOptional()
  requestId?: string;
}
