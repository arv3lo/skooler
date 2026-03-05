import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class InitiateTransferDto {
  @ApiProperty({ description: 'National ID of the student to transfer' })
  @IsString()
  studentNationalId: string;

  @ApiProperty({ description: 'ID of the school sending the student away' })
  @IsUUID()
  fromTenantId: string;
}
