import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'JWT issued by the external auth provider' })
  @IsString()
  externalToken: string;
}
