import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDocDto {
  @IsString()
  @MaxLength(64)
  menuSlug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
