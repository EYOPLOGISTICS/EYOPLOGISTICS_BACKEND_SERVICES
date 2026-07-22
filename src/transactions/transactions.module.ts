import { forwardRef, Global, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from "./transactions.controller";

@Global()
@Module({
  controllers:[TransactionsController],
  providers: [TransactionsService],
  exports:[TransactionsService]
})
export class TransactionsModule {}
