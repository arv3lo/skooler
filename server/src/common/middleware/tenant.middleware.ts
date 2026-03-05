import {
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';

import { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { PrismaService } from '@modules/prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const slug = this.extractSlug(req);

    if (!slug) {
      return next();
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException(`Tenant "${slug}" not found or inactive`);
    }

    req.tenantId = tenant.id;
    req.tenantSlug = slug;

    next();
  }

  private extractSlug(req: AuthenticatedRequest): string | null {
    // Development override via header
    const headerSlug = req.headers['x-tenant-slug'] as string | undefined;
    if (headerSlug) {
      return headerSlug;
    }

    // Extract subdomain from Host header: <slug>.app.com
    const host = req.headers.host ?? '';
    const parts = host.split('.');

    // Expect at least 3 parts: slug.app.com
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }
}
