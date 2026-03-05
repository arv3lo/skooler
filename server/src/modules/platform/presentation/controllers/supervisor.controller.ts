import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { JwtPayload } from '@common/interfaces/jwt-payload.interface';
import { SupervisorService } from '@modules/platform/application/services/supervisor.service';

@ApiTags('platform / supervisor')
@Controller('platform/supervisor')
@UseGuards(RolesGuard)
@Roles(Role.REGIONAL_SUPERVISOR)
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Get('schools')
  @ApiOperation({ summary: 'List all schools in assigned regions (read-only)' })
  getAssignedSchools(@CurrentUser() user: JwtPayload) {
    return this.supervisorService.getAssignedSchools(user.sub);
  }

  @Get('schools/:id/stats')
  @ApiOperation({ summary: 'Get aggregated stats for a school in assigned regions' })
  getSchoolStats(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.supervisorService.getSchoolStats(user.sub, id);
  }

  @Get('regions/summary')
  @ApiOperation({ summary: 'Get per-region summary (student/staff counts)' })
  getRegionSummary(@CurrentUser() user: JwtPayload) {
    return this.supervisorService.getRegionSummary(user.sub);
  }
}
