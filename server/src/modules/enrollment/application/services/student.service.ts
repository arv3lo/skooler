import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentStatus } from '@common/enums/enrollment-status.enum';
import { PrismaService } from '@modules/prisma/prisma.service';

import {
  CreateStudentDto,
  UpdateStudentDto,
} from '../../presentation/dto/student.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.student.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.withTenant(tenantId, (tx) =>
      tx.student.findUnique({
        where: { id, deletedAt: null },
        include: {
          enrollments: {
            where: { deletedAt: null },
            include: { class: { select: { id: true, name: true, subject: true } } },
          },
        },
      }),
    );

    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }

    return student;
  }

  async findByNationalId(tenantId: string, nationalId: string) {
    const student = await this.prisma.withTenant(tenantId, (tx) =>
      tx.student.findFirst({
        where: { tenantId, nationalId, deletedAt: null },
      }),
    );

    if (!student) {
      throw new NotFoundException(
        `Student with national ID "${nationalId}" not found`,
      );
    }

    return student;
  }

  async create(tenantId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.student.findUnique({
      where: { nationalId: dto.nationalId },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        `National ID "${dto.nationalId}" already registered`,
      );
    }

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.student.create({
        data: {
          tenantId,
          nationalId: dto.nationalId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          userId: dto.userId ?? null,
        },
      }),
    );
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.student.update({
        where: { id },
        data: {
          ...dto,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.student.update({
        where: { id },
        data: { deletedAt: new Date(), enrollmentStatus: EnrollmentStatus.INACTIVE },
      }),
    );
  }
}
