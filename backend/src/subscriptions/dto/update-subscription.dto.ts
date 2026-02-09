import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsIn(['monthly', 'annual'])
  period?: 'monthly' | 'annual';

  @IsOptional()
  @IsNumber()
  basePriceEur?: number;

  @IsOptional()
  @IsIn(['active', 'pending', 'cancelled'])
  status?: 'active' | 'pending' | 'cancelled';

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceCodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeServiceCodes?: string[];
}
