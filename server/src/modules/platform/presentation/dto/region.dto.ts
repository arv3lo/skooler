import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class UpdateRegionDto extends PartialType(CreateRegionDto) {}
