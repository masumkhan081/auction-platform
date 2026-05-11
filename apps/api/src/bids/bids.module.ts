import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BidsController } from './bids.controller';
import { BidsRepository } from './bids.repository';
import { BidsService } from './bids.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BidsController],
  providers: [BidsService, BidsRepository],
  exports: [BidsService, BidsRepository],
})
export class BidsModule {}
