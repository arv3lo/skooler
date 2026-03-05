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
import { StaffService } from '@modules/staff/application/services/staff.service';

import {
  CreateStaffProfileDto,
  UpdateStaffProfileDto,
} from '../dto/staff-profile.dto';

@ApiTags('staff')
@Controller('staff')
@UseGuards(RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List all staff profiles' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.staffService.findAll(req.tenantId!);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get a staff profile by ID' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.findOne(req.tenantId!, id);
  }

  @Get('by-user/:userId')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get a staff profile by user ID' })
  findByUser(@Req() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.staffService.findByUser(req.tenantId!, userId);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a staff profile' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStaffProfileDto,
  ) {
    return this.staffService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a staff profile' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    return this.staffService.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a staff profile' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.remove(req.tenantId!, id);
  }
}
