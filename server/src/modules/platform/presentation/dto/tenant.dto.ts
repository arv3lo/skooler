import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { SchoolType } from '@common/enums/school-type.enum';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SchoolType })
  @IsEnum(SchoolType)
  type: SchoolType;

  @ApiProperty()
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @ApiPropertyOptional({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  subscriptionTier?: SubscriptionTier;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class BulkImportTenantDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SchoolType })
  @IsEnum(SchoolType)
  type: SchoolType;

  @ApiProperty()
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  adminEmail?: string;
}

export class BulkImportDto {
  @ApiProperty({ type: [BulkImportTenantDto] })
  schools: BulkImportTenantDto[];
}
