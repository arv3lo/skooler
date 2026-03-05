import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateTermDto {
  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'Semester 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  endDate: string;
}

export class UpdateTermDto extends PartialType(CreateTermDto) {}
