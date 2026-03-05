import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SubscriptionTier } from '@common/enums/subscription-tier.enum';

import { PrismaService } from '@modules/prisma/prisma.service';

import type { Prisma } from '@prisma/client';

import {
  CreateClassDto,
  ScheduleSlotDto,
} from '../../presentation/dto/class.dto';
import { UpdateClassDto } from '../../presentation/dto/class.dto';

interface ScheduleSlot {
  day: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
}

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, termId?: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.class.findMany({
        where: { tenantId, ...(termId ? { termId } : {}), deletedAt: null },
        include: {
          term: { select: { id: true, name: true } },
          room: { select: { id: true, name: true, capacity: true } },
          _count: { select: { enrollments: { where: { deletedAt: null } } } },
        },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const cls = await this.prisma.withTenant(tenantId, (tx) =>
      tx.class.findUnique({
        where: { id, deletedAt: null },
        include: {
          term: { select: { id: true, name: true } },
          room: { select: { id: true, name: true, capacity: true } },
          enrollments: {
            where: { deletedAt: null },
            include: {
              student: {
                select: { id: true, firstName: true, lastName: true, nationalId: true },
              },
            },
          },
        },
      }),
    );

    if (!cls) {
      throw new NotFoundException(`Class ${id} not found`);
    }

    return cls;
  }

  async create(
    tenantId: string,
    dto: CreateClassDto,
    subscriptionTier: SubscriptionTier,
  ) {
    const conflicts = await this.detectConflicts(tenantId, dto, undefined, subscriptionTier);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.class.create({
        data: {
          tenantId,
          termId: dto.termId,
          name: dto.name,
          subject: dto.subject ?? null,
          teacherId: dto.teacherId ?? null,
          roomId: dto.roomId ?? null,
          schedule: (dto.schedule ?? []) as unknown as Prisma.InputJsonValue,
        },
        include: { term: true, room: true },
      }),
    ).then((cls) => ({ ...cls, conflicts }));
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateClassDto,
    subscriptionTier: SubscriptionTier,
  ) {
    await this.findOne(tenantId, id);

    const conflicts = await this.detectConflicts(tenantId, dto, id, subscriptionTier);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.class.update({
        where: { id },
        data: {
          ...(dto.termId !== undefined && { termId: dto.termId }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.subject !== undefined && { subject: dto.subject }),
          ...(dto.teacherId !== undefined && { teacherId: dto.teacherId }),
          ...(dto.roomId !== undefined && { roomId: dto.roomId }),
          ...(dto.schedule !== undefined && {
            schedule: dto.schedule as unknown as Prisma.InputJsonValue,
          }),
        },
      }),
    ).then((cls) => ({ ...cls, conflicts }));
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.class.update({ where: { id }, data: { deletedAt: new Date() } }),
    );
  }

  /**
   * Detects schedule conflicts for teacher and room within the same term.
   * Returns warnings (not errors) — callers decide whether to surface them.
   */
  private async detectConflicts(
    tenantId: string,
    dto: CreateClassDto | UpdateClassDto,
    excludeClassId?: string,
    subscriptionTier: SubscriptionTier = SubscriptionTier.FREE,
  ): Promise<string[]> {
    const tierRank = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
    if (tierRank[subscriptionTier] < tierRank[SubscriptionTier.PRO]) {
      return [];
    }

    if (!dto.schedule?.length || (!dto.teacherId && !dto.roomId)) {
      return [];
    }

    const termId = dto.termId;
    if (!termId) return [];

    const siblings = await this.prisma.withTenant(tenantId, (tx) =>
      tx.class.findMany({
        where: {
          tenantId,
          termId,
          deletedAt: null,
          ...(excludeClassId ? { NOT: { id: excludeClassId } } : {}),
          OR: [
            dto.teacherId ? { teacherId: dto.teacherId } : {},
            dto.roomId ? { roomId: dto.roomId } : {},
          ],
        },
        select: {
          id: true,
          name: true,
          teacherId: true,
          roomId: true,
          schedule: true,
        },
      }),
    );

    const warnings: string[] = [];

    for (const sibling of siblings) {
      const siblingSlots = sibling.schedule as ScheduleSlot[] | null;
      if (!siblingSlots?.length) continue;

      for (const newSlot of dto.schedule) {
        for (const existingSlot of siblingSlots) {
          if (this.slotsOverlap(newSlot, existingSlot)) {
            if (dto.teacherId && sibling.teacherId === dto.teacherId) {
              warnings.push(
                `Teacher conflict with class "${sibling.name}" on ${newSlot.day}`,
              );
            }
            if (dto.roomId && sibling.roomId === dto.roomId) {
              warnings.push(
                `Room conflict with class "${sibling.name}" on ${newSlot.day}`,
              );
            }
          }
        }
      }
    }

    return [...new Set(warnings)];
  }

  private slotsOverlap(a: ScheduleSlotDto, b: ScheduleSlot): boolean {
    if (a.day !== b.day) return false;

    const aStart = a.startHour * 60 + a.startMinute;
    const aEnd = aStart + a.durationMinutes;
    const bStart = b.startHour * 60 + b.startMinute;
    const bEnd = bStart + b.durationMinutes;

    return aStart < bEnd && bStart < aEnd;
  }
}
