import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { Role } from '@common/enums/role.enum';

export class CreateMembershipDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}

export class UpdateMembershipDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
