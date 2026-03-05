import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { ClassEnrollmentService } from '@modules/enrollment/application/services/class-enrollment.service';

import { CreateClassEnrollmentDto } from '../dto/class-enrollment.dto';

@ApiTags('enrollment / class-enrollments')
@Controller('class-enrollments')
@UseGuards(RolesGuard)
export class ClassEnrollmentController {
  constructor(private readonly classEnrollmentService: ClassEnrollmentService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Enroll a student in a class' })
  enroll(@Req() req: AuthenticatedRequest, @Body() dto: CreateClassEnrollmentDto) {
    return this.classEnrollmentService.enroll(req.tenantId!, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Remove a student from a class' })
  unenroll(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.classEnrollmentService.unenroll(req.tenantId!, id);
  }

  @Get('student/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Get all classes a student is enrolled in" })
  findByStudent(
    @Req() req: AuthenticatedRequest,
    @Param('studentId') studentId: string,
  ) {
    return this.classEnrollmentService.findByStudent(req.tenantId!, studentId);
  }

  @Get('class/:classId')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get all students enrolled in a class' })
  findByClass(
    @Req() req: AuthenticatedRequest,
    @Param('classId') classId: string,
  ) {
    return this.classEnrollmentService.findByClass(req.tenantId!, classId);
  }
}
