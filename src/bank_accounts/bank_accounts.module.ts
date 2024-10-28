import { Module } from '@nestjs/common';
import { BankAccountsService } from './bank_accounts.service';
import { BankAccountsController } from './bank_accounts.controller';

@Module({
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
  exports:[BankAccountsService]
})
export class BankAccountsModule {}
