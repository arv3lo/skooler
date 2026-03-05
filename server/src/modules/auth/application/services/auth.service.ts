import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { Role } from '@common/enums/role.enum';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';
import { PrismaService } from '@modules/prisma/prisma.service';

import {
  LoginResponseDto,
  MembershipDto,
  TokenResponseDto,
} from '../../presentation/dto/auth-response.dto';

interface ExternalTokenPayload {
  sub: string;
  email: string;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(externalToken: string): Promise<LoginResponseDto> {
    const external = await this.validateExternalToken(externalToken);

    const user = await this.upsertUser(external);

    const memberships = await this.prisma.tenantMembership.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { tenant: { select: { name: true, slug: true } } },
    });

    const membershipDtos: MembershipDto[] = memberships.map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenant.name,
      tenantSlug: m.tenant.slug,
      role: m.role as Role,
    }));

    return { memberships: membershipDtos };
  }

  async selectTenant(
    externalToken: string,
    tenantId: string,
  ): Promise<TokenResponseDto> {
    const external = await this.validateExternalToken(externalToken);

    const user = await this.upsertUser(external);

    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: { userId: user.id, tenantId },
        deletedAt: null,
      },
      include: {
        tenant: { select: { subscriptionTier: true, isActive: true } },
      },
    });

    if (!membership || !membership.tenant.isActive) {
      throw new NotFoundException('Tenant membership not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: membership.role as Role,
      tenantId,
      subscriptionTier: membership.tenant.subscriptionTier as SubscriptionTier,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.issueRefreshToken(user.id, tenantId);

    return {
      accessToken,
      role: payload.role,
      tenantId,
      subscriptionTier: payload.subscriptionTier,
    };
  }

  async loginPlatformAdmin(externalToken: string): Promise<TokenResponseDto> {
    const external = await this.validateExternalToken(externalToken);

    const user = await this.prisma.user.findUnique({
      where: { externalId: external.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        userId: user.id,
        role: { in: [Role.PLATFORM_ADMIN, Role.REGIONAL_SUPERVISOR] },
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('No platform-level role found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: membership.role as Role,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, role: payload.role };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const memberships = stored.tenantId
      ? await this.prisma.tenantMembership.findMany({
          where: {
            userId: stored.userId,
            tenantId: stored.tenantId,
            deletedAt: null,
          },
          include: { tenant: { select: { subscriptionTier: true } } },
        })
      : [];

    const membership = memberships[0];

    const payload: JwtPayload = membership
      ? {
          sub: stored.userId,
          role: membership.role as Role,
          tenantId: stored.tenantId ?? undefined,
          subscriptionTier:
            membership.tenant.subscriptionTier as SubscriptionTier,
        }
      : {
          sub: stored.userId,
          role: Role.PLATFORM_ADMIN,
        };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: rawRefreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async validateExternalToken(
    token: string,
  ): Promise<ExternalTokenPayload> {
    const jwksUri = this.config.getOrThrow<string>('AUTH_PROVIDER_JWKS_URI');
    const issuer = this.config.getOrThrow<string>('AUTH_PROVIDER_DOMAIN');
    const audience = this.config.getOrThrow<string>('AUTH_PROVIDER_AUDIENCE');

    try {
      const JWKS = createRemoteJWKSet(new URL(jwksUri));

      const { payload } = await jwtVerify(token, JWKS, {
        issuer,
        audience,
      });

      const sub = payload.sub;
      const email = payload['email'] as string | undefined;

      if (!sub || !email) {
        throw new Error('Missing required claims: sub, email');
      }

      return {
        sub,
        email,
        name: payload['name'] as string | undefined,
      };
    } catch (err) {
      throw new UnauthorizedException(
        `Invalid external token: ${(err as Error).message}`,
      );
    }
  }

  private async upsertUser(external: ExternalTokenPayload) {
    return this.prisma.user.upsert({
      where: { externalId: external.sub },
      create: {
        externalId: external.sub,
        email: external.email,
        name: external.name ?? null,
      },
      update: {
        email: external.email,
        name: external.name ?? null,
      },
    });
  }

  private async issueRefreshToken(
    userId: string,
    tenantId: string,
  ): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiryDays = parseInt(
      this.config.getOrThrow<string>('REFRESH_TOKEN_EXPIRY').replace('d', ''),
      10,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await this.prisma.refreshToken.create({
      data: { token, userId, tenantId, expiresAt },
    });

    return token;
  }
}
