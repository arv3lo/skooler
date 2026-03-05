import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@modules/prisma/prisma.service';

import { CreateRoomDto, UpdateRoomDto } from '../../presentation/dto/room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.room.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const room = await this.prisma.withTenant(tenantId, (tx) =>
      tx.room.findUnique({ where: { id, deletedAt: null } }),
    );

    if (!room) {
      throw new NotFoundException(`Room ${id} not found`);
    }

    return room;
  }

  async create(tenantId: string, dto: CreateRoomDto) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.room.create({ data: { tenantId, name: dto.name, capacity: dto.capacity } }),
    );
  }

  async update(tenantId: string, id: string, dto: UpdateRoomDto) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.room.update({ where: { id }, data: dto }),
    );
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.room.update({ where: { id }, data: { deletedAt: new Date() } }),
    );
  }
}
