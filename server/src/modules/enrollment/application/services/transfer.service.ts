import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EnrollmentStatus } from '@common/enums/enrollment-status.enum';
import { PrismaService } from '@modules/prisma/prisma.service';

import { InitiateTransferDto } from '../../presentation/dto/transfer.dto';

@Injectable()
export class TransferService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(toTenantId: string, dto: InitiateTransferDto) {
    // Verify the student exists globally by national ID
    const student = await this.prisma.student.findUnique({
      where: { nationalId: dto.studentNationalId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException(
        `No student found with national ID "${dto.studentNationalId}"`,
      );
    }

    return this.prisma.withTenant(toTenantId, (tx) =>
      tx.transferRequest.create({
        data: {
          tenantId: toTenantId,
          fromTenantId: dto.fromTenantId,
          toTenantId,
          studentNationalId: dto.studentNationalId,
        },
      }),
    );
  }

  async findPending(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.transferRequest.findMany({
        where: { fromTenantId: tenantId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async approve(tenantId: string, transferId: string) {
    const transfer = await this.prisma.withTenant(tenantId, (tx) =>
      tx.transferRequest.findUnique({ where: { id: transferId } }),
    );

    if (!transfer) {
      throw new NotFoundException(`Transfer request ${transferId} not found`);
    }

    if (transfer.fromTenantId !== tenantId) {
      throw new ForbiddenException(
        'Only the source school can approve this transfer',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { nationalId: transfer.studentNationalId },
      include: {
        enrollments: {
          where: { deletedAt: null },
          include: { class: { include: { term: { include: { academicYear: true } } } } },
        },
      },
    });

    const historySnapshot = student
      ? {
          nationalId: student.nationalId,
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth,
          enrollments: student.enrollments,
        }
      : null;

    return this.prisma.withTenant(tenantId, async (tx) => {
      // Attach history snapshot and approve
      const updated = await tx.transferRequest.update({
        where: { id: transferId },
        data: { status: 'APPROVED', historySnapshot: historySnapshot ?? undefined },
      });

      // Soft-delete the student at the source school
      if (student) {
        await tx.student.update({
          where: { id: student.id },
          data: {
            deletedAt: new Date(),
            enrollmentStatus: EnrollmentStatus.TRANSFERRED,
          },
        });
      }

      return updated;
    });
  }

  async reject(tenantId: string, transferId: string) {
    const transfer = await this.prisma.withTenant(tenantId, (tx) =>
      tx.transferRequest.findUnique({ where: { id: transferId } }),
    );

    if (!transfer) {
      throw new NotFoundException(`Transfer request ${transferId} not found`);
    }

    if (transfer.fromTenantId !== tenantId) {
      throw new ForbiddenException(
        'Only the source school can reject this transfer',
      );
    }

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.transferRequest.update({
        where: { id: transferId },
        data: { status: 'REJECTED' },
      }),
    );
  }
}
