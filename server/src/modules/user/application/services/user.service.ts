import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../../presentation/dto/membership.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findMemberships(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { userId, deletedAt: null },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            subscriptionTier: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createMembership(dto: CreateMembershipDto) {
    const existing = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: { userId: dto.userId, tenantId: dto.tenantId },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Membership already exists');
    }

    return this.prisma.tenantMembership.create({
      data: { userId: dto.userId, tenantId: dto.tenantId, role: dto.role },
    });
  }

  async updateMembership(membershipId: string, dto: UpdateMembershipDto) {
    return this.prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { role: dto.role },
    });
  }

  async removeMembership(membershipId: string) {
    return this.prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { deletedAt: new Date() },
    });
  }
}
