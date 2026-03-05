import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { RoomService } from '@modules/schedule/application/services/room.service';

import { CreateRoomDto, UpdateRoomDto } from '../dto/room.dto';

@ApiTags('schedule / rooms')
@Controller('rooms')
@UseGuards(RolesGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List all rooms' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.roomService.findAll(req.tenantId!);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get a room' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a room' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoomDto) {
    return this.roomService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a room' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a room' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomService.remove(req.tenantId!, id);
  }
}
