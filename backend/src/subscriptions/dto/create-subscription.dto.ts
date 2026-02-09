import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsIn(['monthly', 'annual'])
  period!: 'monthly' | 'annual';

  @IsNumber()
  basePriceEur!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceCodes?: string[];

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}
