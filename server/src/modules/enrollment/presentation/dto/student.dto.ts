import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { EnrollmentStatus } from '@common/enums/enrollment-status.enum';

export class CreateStudentDto {
  @ApiProperty({ description: 'National ID or birth certificate number' })
  @IsString()
  nationalId: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '2005-09-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Linked platform user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  enrollmentStatus?: EnrollmentStatus;
}
