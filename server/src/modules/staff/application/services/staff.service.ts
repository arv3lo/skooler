import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import {
  CreateStaffProfileDto,
  UpdateStaffProfileDto,
} from '../../presentation/dto/staff-profile.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const profile = await this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.findUnique({ where: { id, deletedAt: null } }),
    );

    if (!profile) {
      throw new NotFoundException(`Staff profile ${id} not found`);
    }

    return profile;
  }

  async findByUser(tenantId: string, userId: string) {
    const profile = await this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.findFirst({
        where: { tenantId, userId, deletedAt: null },
      }),
    );

    if (!profile) {
      throw new NotFoundException(
        `No staff profile for user ${userId} in this school`,
      );
    }

    return profile;
  }

  async create(tenantId: string, dto: CreateStaffProfileDto) {
    const existing = await this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.findFirst({
        where: { tenantId, userId: dto.userId, deletedAt: null },
      }),
    );

    if (existing) {
      throw new ConflictException(
        'A staff profile for this user already exists in this school',
      );
    }

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.create({
        data: {
          tenantId,
          userId: dto.userId,
          bio: dto.bio ?? null,
          subjects: dto.subjects ?? [],
        },
      }),
    );
  }

  async update(tenantId: string, id: string, dto: UpdateStaffProfileDto) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.update({
        where: { id },
        data: {
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.subjects !== undefined && { subjects: dto.subjects }),
        },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.staffProfile.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    );
  }
}
