import { ApiProperty } from '@nestjs/swagger';

import { Role } from '@common/enums/role.enum';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';

export class MembershipDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  tenantName: string;

  @ApiProperty()
  tenantSlug: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class LoginResponseDto {
  @ApiProperty({ type: [MembershipDto] })
  memberships: MembershipDto[];
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ required: false })
  tenantId?: string;

  @ApiProperty({ enum: SubscriptionTier, required: false })
  subscriptionTier?: SubscriptionTier;
}
