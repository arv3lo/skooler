import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import { UpdateSchoolProfileDto } from '../../presentation/dto/school-profile.dto';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '../../presentation/dto/announcement.dto';

@Injectable()
export class PublicProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        logoUrl: true,
        phone: true,
        address: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`School "${slug}" not found`);
    }

    const announcements = await this.prisma.withTenant(tenant.id, (tx) =>
      tx.schoolAnnouncement.findMany({
        where: { tenantId: tenant.id, isPublic: true, deletedAt: null },
        select: { id: true, title: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    );

    return { ...tenant, announcements };
  }

  async updateProfile(tenantId: string, dto: UpdateSchoolProfileDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        phone: true,
        address: true,
      },
    });
  }

  // ── Announcements ────────────────────────────────────────────

  async findAnnouncements(tenantId: string, publicOnly = false) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.schoolAnnouncement.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(publicOnly ? { isPublic: true } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async createAnnouncement(tenantId: string, dto: CreateAnnouncementDto) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.schoolAnnouncement.create({
        data: {
          tenantId,
          title: dto.title,
          content: dto.content,
          isPublic: dto.isPublic ?? true,
        },
      }),
    );
  }

  async updateAnnouncement(
    tenantId: string,
    announcementId: string,
    dto: UpdateAnnouncementDto,
  ) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const record = await tx.schoolAnnouncement.findUnique({
        where: { id: announcementId, deletedAt: null },
      });

      if (!record) {
        throw new NotFoundException(
          `Announcement ${announcementId} not found`,
        );
      }

      return tx.schoolAnnouncement.update({
        where: { id: announcementId },
        data: dto,
      });
    });
  }

  async removeAnnouncement(tenantId: string, announcementId: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const record = await tx.schoolAnnouncement.findUnique({
        where: { id: announcementId, deletedAt: null },
      });

      if (!record) {
        throw new NotFoundException(
          `Announcement ${announcementId} not found`,
        );
      }

      return tx.schoolAnnouncement.update({
        where: { id: announcementId },
        data: { deletedAt: new Date() },
      });
    });
  }
}
