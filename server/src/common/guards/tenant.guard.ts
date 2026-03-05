import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Role } from '@common/enums/role.enum';
import { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';

// Platform-level roles do not need tenant isolation
const PLATFORM_ROLES: Role[] = [Role.PLATFORM_ADMIN, Role.REGIONAL_SUPERVISOR];

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user, tenantId } = request;

    if (!user) {
      return true;
    }

    if (PLATFORM_ROLES.includes(user.role)) {
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('No tenant in token');
    }

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Token tenant does not match request tenant');
    }

    return true;
  }
}
