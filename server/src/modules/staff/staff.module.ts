import { Module } from '@nestjs/common';

import { StaffService } from '@modules/staff/application/services/staff.service';
import { StaffController } from '@modules/staff/presentation/controllers/staff.controller';

@Module({
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
