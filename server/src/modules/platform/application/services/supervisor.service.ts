import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

@Injectable()
export class SupervisorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * All queries here bypass RLS intentionally — supervisors have
   * cross-tenant read access scoped to their assigned regions.
   */

  async getAssignedSchools(userId: string) {
    const assignments = await this.prisma.supervisorRegionAssignment.findMany({
      where: { userId },
      select: { regionId: true },
    });

    if (!assignments.length) {
      return [];
    }

    const regionIds = assignments.map((a) => a.regionId);

    return this.prisma.tenant.findMany({
      where: { regionId: { in: regionIds }, deletedAt: null, isActive: true },
      include: { region: { select: { id: true, name: true } } },
      orderBy: [{ region: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getSchoolStats(userId: string, tenantId: string) {
    // Verify the supervisor has access to this school's region
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      select: { id: true, name: true, regionId: true },
    });

    if (!tenant) {
      throw new NotFoundException(`School ${tenantId} not found`);
    }

    const hasAccess = await this.prisma.supervisorRegionAssignment.findFirst({
      where: { userId, regionId: tenant.regionId },
    });

    if (!hasAccess) {
      throw new NotFoundException(`School ${tenantId} not found`);
    }

    // All counts bypass RLS — query with explicit tenantId filter
    const [studentCount, staffCount, classCount, activeEnrollments] =
      await Promise.all([
        this.prisma.student.count({
          where: { tenantId, deletedAt: null, enrollmentStatus: 'ACTIVE' },
        }),
        this.prisma.staffProfile.count({
          where: { tenantId, deletedAt: null },
        }),
        this.prisma.class.count({
          where: { tenantId, deletedAt: null },
        }),
        this.prisma.classEnrollment.count({
          where: { tenantId, deletedAt: null },
        }),
      ]);

    return {
      tenantId,
      name: tenant.name,
      studentCount,
      staffCount,
      classCount,
      activeEnrollments,
    };
  }

  async getRegionSummary(userId: string) {
    const assignments = await this.prisma.supervisorRegionAssignment.findMany({
      where: { userId },
      include: { region: true },
    });

    if (!assignments.length) {
      return [];
    }

    const regionIds = assignments.map((a) => a.regionId);

    const schools = await this.prisma.tenant.findMany({
      where: { regionId: { in: regionIds }, deletedAt: null, isActive: true },
      select: { id: true, regionId: true },
    });

    const tenantIds = schools.map((s) => s.id);

    const [students, staff] = await Promise.all([
      this.prisma.student.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds }, deletedAt: null, enrollmentStatus: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.staffProfile.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: tenantIds }, deletedAt: null },
        _count: true,
      }),
    ]);

    const studentsByTenant = Object.fromEntries(
      students.map((s) => [s.tenantId, s._count]),
    );
    const staffByTenant = Object.fromEntries(
      staff.map((s) => [s.tenantId, s._count]),
    );

    return assignments.map(({ region }) => {
      const regionSchools = schools.filter((s) => s.regionId === region.id);
      const totalStudents = regionSchools.reduce(
        (sum, s) => sum + (studentsByTenant[s.id] ?? 0),
        0,
      );
      const totalStaff = regionSchools.reduce(
        (sum, s) => sum + (staffByTenant[s.id] ?? 0),
        0,
      );

      return {
        regionId: region.id,
        regionName: region.name,
        schoolCount: regionSchools.length,
        totalStudents,
        totalStaff,
      };
    });
  }
}
