import { PartialType } from '@nestjs/swagger';
import { CreateBankAccountDto } from './create-bank_account.dto';

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {}
