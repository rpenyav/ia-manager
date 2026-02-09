import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsBoolean()
  killSwitch?: boolean;

  @IsOptional()
  @IsString()
  status?: 'active' | 'suspended' | 'disabled';

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  contactName?: string;

  @IsOptional()
  @IsString()
  @Length(4, 40)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @Length(0, 180)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  billingAddressLine1?: string;

  @IsOptional()
  @IsString()
  @Length(0, 180)
  billingAddressLine2?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  billingCountry?: string;

  @IsOptional()
  @IsString()
  @Length(2, 40)
  taxId?: string;

  @IsOptional()
  @IsString()
  @Length(4, 180)
  website?: string;

  @IsOptional()
  @IsString()
  @Length(4, 120)
  authUsername?: string;

  @IsOptional()
  @IsString()
  @Length(6, 120)
  authPassword?: string;
}
