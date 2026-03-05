import { Role } from '@common/enums/role.enum';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
  tenantId?: string;
  subscriptionTier?: SubscriptionTier;
}
