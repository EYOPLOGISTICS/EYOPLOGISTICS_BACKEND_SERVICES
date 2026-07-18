import { Injectable } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank_account.dto';
import { UpdateBankAccountDto } from './dto/update-bank_account.dto';
import usePaystackService from '../services/paystack';
import { BankAccount } from './entities/bank_account.entity';
import { User } from '../users/entities/user.entity';
import { returnErrorResponse, successResponse } from '../utils/response';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Not } from 'typeorm';

const {
  verifyBankAccount,
  createTransferRecipient,
  createSubaccount,
  updateSubaccount,
} = usePaystackService;

@Injectable()
export class BankAccountsService {
  async create(
    user: User,
    createBankAccountDto: CreateBankAccountDto,
    vendor: Vendor,
  ) {
    const { account_number, bank_code, bank_name, vendor_id } =
      createBankAccountDto;
    const verified_bank_details = await verifyBankAccount(
      account_number,
      bank_code,
    );
    const bankAccountExistAndDoesNotBelongToVendor = await BankAccount.findOne({
      where: {
        user_id: Not(vendor.owner_id),
        account_number,
        bank_code,
      },
    });
    if (bankAccountExistAndDoesNotBelongToVendor)
      returnErrorResponse('bank account already exist for another resource');

    const bankAccountExistAndBelongsToVendor = await BankAccount.findOne({
      where: {
        vendor_id: vendor.id,
        account_number,
        bank_code,
      },
    });
    if (bankAccountExistAndBelongsToVendor)
      returnErrorResponse('Bank account already exist');

    const subaccount = await createSubaccount(
      vendor.name,
      bank_code,
      account_number,
      0,
    );

    const bank = new BankAccount();
    bank.bank_name = bank_name;
    bank.bank_code = bank_code;
    bank.account_number = account_number;
    bank.account_name = verified_bank_details.account_name;
    bank.vendor_id = vendor.id;
    bank.user_id = vendor.owner_id;
    bank.bank_id = verified_bank_details.bank_id;
    await bank.save();

    vendor.has_bank_account = true;
    vendor.paystack_subaccount_code = subaccount.subaccount_code;

    await vendor.save();
    return successResponse('bank details created successfully');
  }

  async findOne(
    user: User,
    vendorId?: string,
  ): Promise<BankAccount | undefined> {
    const condition = {};
    if (vendorId) {
      condition['vendor_id'] = vendorId;
    } else {
      condition['user_id'] = user.id;
    }
    return await BankAccount.findOne({ where: condition });
  }

  async update(
    bankId: string,
    user: User,
    updateBankAccountDto: UpdateBankAccountDto,
    vendor: Vendor,
  ) {
    const { account_number, bank_code, bank_name, vendor_id } =
      updateBankAccountDto;
    const bank = await BankAccount.findOne({
      where: { id: bankId },
    });

    const verified_bank_details = await verifyBankAccount(
      account_number,
      bank_code,
    );
    if (!bank) returnErrorResponse('bank does not exist');

    if (bank.account_number !== account_number) {
      const subaccount = await updateSubaccount(
        vendor.paystack_subaccount_code,
        vendor.name,
        bank_code,
        account_number,
        0,
      );
      bank.bank_name = bank_name;
      bank.bank_code = bank_code;
      bank.account_number = account_number;
      bank.account_name = verified_bank_details.account_name;
      bank.vendor_id = vendor.id;
      bank.user_id = vendor.owner_id;
      bank.bank_id = verified_bank_details.bank_id;
      await bank.save();

      vendor.has_bank_account = true;
      vendor.paystack_subaccount_code = subaccount.subaccount_code;
      await vendor.save();
    }
    return successResponse('bank details updated successfully');
  }

  remove(id: number) {
    return `This action removes a #${id} bankAccount`;
  }
}
