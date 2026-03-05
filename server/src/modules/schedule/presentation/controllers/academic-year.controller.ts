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
import { AcademicYearService } from '@modules/schedule/application/services/academic-year.service';

import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from '../dto/academic-year.dto';

@ApiTags('schedule / academic-years')
@Controller('academic-years')
@UseGuards(RolesGuard)
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List all academic years' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.academicYearService.findAll(req.tenantId!);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get an academic year with its terms' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.academicYearService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create an academic year' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAcademicYearDto,
  ) {
    return this.academicYearService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an academic year' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearService.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete an academic year' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.academicYearService.remove(req.tenantId!, id);
  }
}
