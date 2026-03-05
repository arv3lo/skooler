import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { TermService } from '@modules/schedule/application/services/term.service';

import { CreateTermDto, UpdateTermDto } from '../dto/term.dto';

@ApiTags('schedule / terms')
@Controller('terms')
@UseGuards(RolesGuard)
export class TermController {
  constructor(private readonly termService: TermService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List terms (optionally filter by academic year)' })
  @ApiQuery({ name: 'academicYearId', required: true })
  findByYear(
    @Req() req: AuthenticatedRequest,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.termService.findByYear(req.tenantId!, academicYearId);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get a term with its classes' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.termService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a term' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTermDto) {
    return this.termService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a term' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
  ) {
    return this.termService.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a term' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.termService.remove(req.tenantId!, id);
  }
}
