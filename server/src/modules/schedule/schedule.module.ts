import { Module } from '@nestjs/common';

import { AcademicYearService } from '@modules/schedule/application/services/academic-year.service';
import { ClassService } from '@modules/schedule/application/services/class.service';
import { RoomService } from '@modules/schedule/application/services/room.service';
import { TermService } from '@modules/schedule/application/services/term.service';
import { AcademicYearController } from '@modules/schedule/presentation/controllers/academic-year.controller';
import { ClassController } from '@modules/schedule/presentation/controllers/class.controller';
import { RoomController } from '@modules/schedule/presentation/controllers/room.controller';
import { TermController } from '@modules/schedule/presentation/controllers/term.controller';

@Module({
  controllers: [
    AcademicYearController,
    TermController,
    RoomController,
    ClassController,
  ],
  providers: [AcademicYearService, TermService, RoomService, ClassService],
  exports: [ClassService],
})
export class ScheduleModule {}
