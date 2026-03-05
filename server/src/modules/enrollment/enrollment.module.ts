import { Module } from '@nestjs/common';

import { ClassEnrollmentService } from '@modules/enrollment/application/services/class-enrollment.service';
import { StudentService } from '@modules/enrollment/application/services/student.service';
import { TransferService } from '@modules/enrollment/application/services/transfer.service';
import { ClassEnrollmentController } from '@modules/enrollment/presentation/controllers/class-enrollment.controller';
import { StudentController } from '@modules/enrollment/presentation/controllers/student.controller';
import { TransferController } from '@modules/enrollment/presentation/controllers/transfer.controller';

@Module({
  controllers: [StudentController, ClassEnrollmentController, TransferController],
  providers: [StudentService, ClassEnrollmentService, TransferService],
  exports: [StudentService],
})
export class EnrollmentModule {}
