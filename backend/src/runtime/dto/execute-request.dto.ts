import { IsObject, IsOptional, IsString, Length } from 'class-validator';

export class ExecuteRequestDto {
  @IsString()
  @Length(2, 64)
  providerId!: string;

  @IsString()
  @Length(1, 128)
  model!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  requestId?: string;
}
