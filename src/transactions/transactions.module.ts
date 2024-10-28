import { Global, Module } from "@nestjs/common";
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entities/transaction.entity";
import { TransactionsController } from "./transactions.controller";
@Global()
@Module({
  controllers:[TransactionsController],
  providers: [TransactionsService],
  exports:[TransactionsService]
})
export class TransactionsModule {}
