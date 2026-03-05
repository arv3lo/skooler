import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from '../../presentation/dto/academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.academicYear.findMany({
        where: { tenantId, deletedAt: null },
        include: { terms: { where: { deletedAt: null }, orderBy: { startDate: 'asc' } } },
        orderBy: { startDate: 'desc' },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const year = await this.prisma.withTenant(tenantId, (tx) =>
      tx.academicYear.findUnique({
        where: { id, deletedAt: null },
        include: {
          terms: {
            where: { deletedAt: null },
            orderBy: { startDate: 'asc' },
            include: { classes: { where: { deletedAt: null } } },
          },
        },
      }),
    );

    if (!year) {
      throw new NotFoundException(`Academic year ${id} not found`);
    }

    return year;
  }

  async create(tenantId: string, dto: CreateAcademicYearDto) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      // Only one current year per tenant
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { tenantId, isCurrent: true, deletedAt: null },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.create({
        data: {
          tenantId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isCurrent: dto.isCurrent ?? false,
        },
      });
    });
  }

  async update(tenantId: string, id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { tenantId, isCurrent: true, deletedAt: null, NOT: { id } },
          data: { isCurrent: false },
        });
      }

      return tx.academicYear.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.academicYear.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    );
  }
}
