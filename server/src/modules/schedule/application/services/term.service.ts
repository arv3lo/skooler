import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import { CreateTermDto, UpdateTermDto } from '../../presentation/dto/term.dto';

@Injectable()
export class TermService {
  constructor(private readonly prisma: PrismaService) {}

  async findByYear(tenantId: string, academicYearId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.findMany({
        where: { academicYearId, tenantId, deletedAt: null },
        orderBy: { startDate: 'asc' },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const term = await this.prisma.withTenant(tenantId, (tx) =>
      tx.term.findUnique({
        where: { id, deletedAt: null },
        include: { classes: { where: { deletedAt: null } } },
      }),
    );

    if (!term) {
      throw new NotFoundException(`Term ${id} not found`);
    }

    return term;
  }

  async create(tenantId: string, dto: CreateTermDto) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.create({
        data: {
          tenantId,
          academicYearId: dto.academicYearId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      }),
    );
  }

  async update(tenantId: string, id: string, dto: UpdateTermDto) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.update({ where: { id }, data: { deletedAt: new Date() } }),
    );
  }
}
