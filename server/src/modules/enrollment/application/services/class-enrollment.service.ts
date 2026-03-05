import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import { CreateClassEnrollmentDto } from '../../presentation/dto/class-enrollment.dto';

@Injectable()
export class ClassEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(tenantId: string, dto: CreateClassEnrollmentDto) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const [student, cls] = await Promise.all([
        tx.student.findUnique({
          where: { id: dto.studentId, deletedAt: null },
        }),
        tx.class.findUnique({
          where: { id: dto.classId, deletedAt: null },
        }),
      ]);

      if (!student) {
        throw new NotFoundException(`Student ${dto.studentId} not found`);
      }
      if (!cls) {
        throw new NotFoundException(`Class ${dto.classId} not found`);
      }

      const existing = await tx.classEnrollment.findUnique({
        where: {
          studentId_classId: {
            studentId: dto.studentId,
            classId: dto.classId,
          },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Student already enrolled in this class');
      }

      return tx.classEnrollment.create({
        data: {
          tenantId,
          studentId: dto.studentId,
          classId: dto.classId,
        },
      });
    });
  }

  async unenroll(tenantId: string, enrollmentId: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const record = await tx.classEnrollment.findUnique({
        where: { id: enrollmentId, deletedAt: null },
      });

      if (!record) {
        throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
      }

      return tx.classEnrollment.update({
        where: { id: enrollmentId },
        data: { deletedAt: new Date() },
      });
    });
  }

  async findByStudent(tenantId: string, studentId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.classEnrollment.findMany({
        where: { studentId, tenantId, deletedAt: null },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
              schedule: true,
              term: { select: { id: true, name: true } },
            },
          },
        },
      }),
    );
  }

  async findByClass(tenantId: string, classId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.classEnrollment.findMany({
        where: { classId, tenantId, deletedAt: null },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              enrollmentStatus: true,
            },
          },
        },
      }),
    );
  }
}
