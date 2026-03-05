import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import {
  CreateRegionDto,
  UpdateRegionDto,
} from '../../presentation/dto/region.dto';

@Injectable()
export class RegionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({ where: { id } });

    if (!region) {
      throw new NotFoundException(`Region ${id} not found`);
    }

    return region;
  }

  async create(dto: CreateRegionDto) {
    const existing = await this.prisma.region.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Region "${dto.name}" already exists`);
    }

    return this.prisma.region.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateRegionDto) {
    await this.findOne(id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async assignSupervisor(userId: string, regionId: string) {
    await this.findOne(regionId);

    return this.prisma.supervisorRegionAssignment.upsert({
      where: { userId_regionId: { userId, regionId } },
      create: { userId, regionId },
      update: {},
    });
  }

  async removeSupervisor(userId: string, regionId: string) {
    await this.prisma.supervisorRegionAssignment.deleteMany({
      where: { userId, regionId },
    });
  }
}
