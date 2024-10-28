import { Module } from '@nestjs/common';
import { VendorsService } from './services/vendors.service';
import { VendorsController } from './controllers/vendors.controller';
import {BankAccountsModule} from "../bank_accounts/bank_accounts.module";
import {BankAccountsService} from "../bank_accounts/bank_accounts.service";

@Module({
  imports:[BankAccountsModule],
  controllers: [VendorsController],
  providers: [VendorsService, BankAccountsService],
})
export class VendorsModule {}
