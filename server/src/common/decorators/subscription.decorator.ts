import { SetMetadata } from '@nestjs/common';

import { SubscriptionTier } from '@common/enums/subscription-tier.enum';

export const SUBSCRIPTION_KEY = 'subscription';
export const RequireSubscription = (tier: SubscriptionTier) =>
  SetMetadata(SUBSCRIPTION_KEY, tier);
