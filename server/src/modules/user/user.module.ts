import { Module } from '@nestjs/common';

import { UserService } from '@modules/user/application/services/user.service';
import { UserController } from '@modules/user/presentation/controllers/user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
