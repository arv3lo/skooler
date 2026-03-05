import { Module } from '@nestjs/common';

import { RegionService } from '@modules/platform/application/services/region.service';
import { TenantService } from '@modules/platform/application/services/tenant.service';
import { RegionController } from '@modules/platform/presentation/controllers/region.controller';
import { TenantController } from '@modules/platform/presentation/controllers/tenant.controller';

@Module({
  controllers: [TenantController, RegionController],
  providers: [TenantService, RegionService],
  exports: [TenantService],
})
export class PlatformModule {}
