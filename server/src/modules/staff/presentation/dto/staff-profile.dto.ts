import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateStaffProfileDto {
  @ApiProperty({ description: 'Platform user ID for this staff member' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ type: [String], example: ['Mathematics', 'Physics'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];
}

export class UpdateStaffProfileDto extends PartialType(CreateStaffProfileDto) {}
