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
import { TenantService } from '@modules/platform/application/services/tenant.service';

import {
  BulkImportDto,
  CreateTenantDto,
  UpdateTenantDto,
} from '../dto/tenant.dto';

@ApiTags('platform / tenants')
@Controller('platform/tenants')
@UseGuards(RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: 'List all schools' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a school' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import schools from national registry' })
  bulkImport(@Body() dto: BulkImportDto) {
    return this.tenantService.bulkImport(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a school' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a school' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
