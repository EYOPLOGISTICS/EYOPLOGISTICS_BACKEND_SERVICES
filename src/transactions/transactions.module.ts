import { Global, Module } from "@nestjs/common";
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entities/transaction.entity";
import { TransactionsController } from "./transactions.controller";
import { DriversModule } from "../drivers/drivers.module";
import { DriversService } from "../drivers/drivers.service";

@Global()
@Module({
  imports:[DriversModule, TypeOrmModule.forFeature([Transaction])],
  controllers:[TransactionsController],
  providers: [TransactionsService, DriversService],
  exports:[TransactionsService]
})
export class TransactionsModule {}
