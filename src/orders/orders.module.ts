import { forwardRef, Global, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { TransactionsService } from '../transactions/transactions.service';

@Global()
@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // IMPORTANT
})
export class OrdersModule {}
