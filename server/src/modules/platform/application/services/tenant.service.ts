import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SubscriptionTier } from '@common/enums/subscription-tier.enum';
import { PrismaService } from '@modules/prisma/prisma.service';

import {
  BulkImportDto,
  CreateTenantDto,
  UpdateTenantDto,
} from '../../presentation/dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      include: { region: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id, deletedAt: null },
      include: { region: { select: { id: true, name: true } } },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }

    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const slug = this.deriveSlug(dto.name);

    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" already taken`);
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        regionId: dto.regionId,
        adminEmail: dto.adminEmail,
        subscriptionTier: dto.subscriptionTier ?? SubscriptionTier.FREE,
      },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkImport(dto: BulkImportDto) {
    const results = await Promise.allSettled(
      dto.schools.map((school) => this.create(school)),
    );

    const created = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message ?? 'Unknown');

    return { created: created.length, errors };
  }

  private deriveSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
