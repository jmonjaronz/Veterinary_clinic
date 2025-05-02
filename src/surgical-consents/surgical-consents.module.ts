import { Module } from '@nestjs/common';
import { SurgicalConsentsController } from './surgical-consents.controller';
import { SurgicalConsentsService } from './surgical-consents.service';

@Module({
  controllers: [SurgicalConsentsController],
  providers: [SurgicalConsentsService]
})
export class SurgicalConsentsModule {}
