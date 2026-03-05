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
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { ClassService } from '@modules/schedule/application/services/class.service';

import { CreateClassDto, UpdateClassDto } from '../dto/class.dto';

@ApiTags('schedule / classes')
@Controller('classes')
@UseGuards(RolesGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List classes (optionally filter by term)' })
  @ApiQuery({ name: 'termId', required: false })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('termId') termId?: string,
  ) {
    return this.classService.findAll(req.tenantId!, termId);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get a class with enrolled students' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.classService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Create a class — returns conflict warnings if any',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateClassDto) {
    return this.classService.create(
      req.tenantId!,
      dto,
      req.user.subscriptionTier ?? SubscriptionTier.FREE,
    );
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a class — returns conflict warnings if any' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.update(
      req.tenantId!,
      id,
      dto,
      req.user.subscriptionTier ?? SubscriptionTier.FREE,
    );
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a class' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.classService.remove(req.tenantId!, id);
  }
}
