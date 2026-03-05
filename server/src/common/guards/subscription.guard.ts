import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SUBSCRIPTION_KEY } from '@common/decorators/subscription.decorator';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';
import { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';

const TIER_RANK: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.PRO]: 1,
  [SubscriptionTier.ENTERPRISE]: 2,
};

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user?.subscriptionTier) {
      throw new ForbiddenException('No subscription information in token');
    }

    if (TIER_RANK[user.subscriptionTier] < TIER_RANK[requiredTier]) {
      throw new ForbiddenException(
        `This feature requires ${requiredTier} subscription`,
      );
    }

    return true;
  }
}
