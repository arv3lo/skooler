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
import { StudentService } from '@modules/enrollment/application/services/student.service';

import { CreateStudentDto, UpdateStudentDto } from '../dto/student.dto';

@ApiTags('enrollment / students')
@Controller('students')
@UseGuards(RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List all students in the current tenant' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.studentService.findAll(req.tenantId!);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get a student by ID' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studentService.findOne(req.tenantId!, id);
  }

  @Get('by-national-id/:nationalId')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Look up a student by national ID' })
  findByNationalId(
    @Req() req: AuthenticatedRequest,
    @Param('nationalId') nationalId: string,
  ) {
    return this.studentService.findByNationalId(req.tenantId!, nationalId);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Register a new student' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateStudentDto) {
    return this.studentService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a student record' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentService.update(req.tenantId!, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a student record' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studentService.remove(req.tenantId!, id);
  }
}
