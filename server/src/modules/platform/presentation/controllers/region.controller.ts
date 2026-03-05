import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import { RegionService } from '@modules/platform/application/services/region.service';

import { CreateRegionDto, UpdateRegionDto } from '../dto/region.dto';

@ApiTags('platform / regions')
@Controller('platform/regions')
@UseGuards(RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get()
  @ApiOperation({ summary: 'List all regions' })
  findAll() {
    return this.regionService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a region' })
  create(@Body() dto: CreateRegionDto) {
    return this.regionService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a region' })
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.regionService.update(id, dto);
  }

  @Post(':regionId/supervisors/:userId')
  @ApiOperation({ summary: 'Assign a supervisor to a region' })
  assignSupervisor(
    @Param('userId') userId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.assignSupervisor(userId, regionId);
  }

  @Delete(':regionId/supervisors/:userId')
  @ApiOperation({ summary: 'Remove a supervisor from a region' })
  removeSupervisor(
    @Param('userId') userId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.removeSupervisor(userId, regionId);
  }
}
