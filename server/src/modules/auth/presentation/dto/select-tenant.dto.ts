import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SelectTenantDto {
  @ApiProperty({ description: 'JWT issued by the external auth provider' })
  @IsString()
  externalToken: string;

  @ApiProperty({ description: 'ID of the tenant to scope the session to' })
  @IsUUID()
  tenantId: string;
}
