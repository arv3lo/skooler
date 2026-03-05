import { Module } from '@nestjs/common';

import { RegionService } from '@modules/platform/application/services/region.service';
import { SupervisorService } from '@modules/platform/application/services/supervisor.service';
import { TenantService } from '@modules/platform/application/services/tenant.service';
import { RegionController } from '@modules/platform/presentation/controllers/region.controller';
import { SupervisorController } from '@modules/platform/presentation/controllers/supervisor.controller';
import { TenantController } from '@modules/platform/presentation/controllers/tenant.controller';

@Module({
  controllers: [TenantController, RegionController, SupervisorController],
  providers: [TenantService, RegionService, SupervisorService],
  exports: [TenantService],
})
export class PlatformModule {}
