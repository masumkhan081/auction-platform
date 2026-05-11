import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';
import { QueueModule } from '../queue/queue.module';
import { AuctionLifecycleService } from './auction-lifecycle.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsService } from './auctions.service';

@Module({
  imports: [ProductsModule, NotificationsModule, forwardRef(() => QueueModule)],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsRepository, AuctionLifecycleService],
  exports: [AuctionsRepository, AuctionsService, AuctionLifecycleService],
})
export class AuctionsModule {}
