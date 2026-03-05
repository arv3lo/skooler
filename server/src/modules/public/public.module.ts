import { Module } from '@nestjs/common';

import { PublicProfileService } from '@modules/public/application/services/public-profile.service';
import { PublicProfileController } from '@modules/public/presentation/controllers/public-profile.controller';

@Module({
  controllers: [PublicProfileController],
  providers: [PublicProfileService],
})
export class PublicModule {}
