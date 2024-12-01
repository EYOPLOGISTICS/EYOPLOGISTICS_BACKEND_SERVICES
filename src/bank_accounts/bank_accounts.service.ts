import {Injectable} from '@nestjs/common';
import {CreateBankAccountDto} from './dto/create-bank_account.dto';
import {UpdateBankAccountDto} from './dto/update-bank_account.dto';
import usePaystackService from "../services/paystack";
import {BankAccount} from "./entities/bank_account.entity";
import {User} from "../users/entities/user.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {Vendor} from "../vendors/entities/vendor.entity";
import {Not} from "typeorm";

const {verifyBankAccount, createTransferRecipient} = usePaystackService;

@Injectable()
export class BankAccountsService {
    async create(user: User, createBankAccountDto: CreateBankAccountDto, vendor: Vendor) {
        const {account_number, bank_code, bank_name, vendor_id} = createBankAccountDto;
        const verified_bank_details = await verifyBankAccount(account_number, bank_code);
        const bankAccountExistAndDoesNotBelongToVendor = await BankAccount.findOne({
            where: {
                user_id: Not(vendor.owner_id),
                account_number,
                bank_code
            }
        })
        if (bankAccountExistAndDoesNotBelongToVendor) returnErrorResponse('bank account already exist');

        const bankAccountExistAndBelongsToVendor = await BankAccount.findOne({
            where: {
                user_id: vendor.owner_id,
                account_number,
                bank_code
            }
        })
        const paystack_recipient = !bankAccountExistAndBelongsToVendor ? await createTransferRecipient(account_number, verified_bank_details.account_name, bank_code) : null;

        const bank = new BankAccount();
        bank.bank_name = bank_name;
        bank.bank_code = bank_code;
        bank.recipient_code = bankAccountExistAndBelongsToVendor ? bankAccountExistAndBelongsToVendor.recipient_code : paystack_recipient.recipient_code;
        bank.account_name = verified_bank_details.account_name;
        bank.auth_code = bankAccountExistAndBelongsToVendor ? bankAccountExistAndBelongsToVendor.auth_code : paystack_recipient.details.authorization_code;
        bank.currency = bankAccountExistAndBelongsToVendor ? bankAccountExistAndBelongsToVendor.currency : paystack_recipient.currency;
        bank.email = bankAccountExistAndBelongsToVendor ? bankAccountExistAndBelongsToVendor.email : paystack_recipient.email;
        bank.recipient_id = bankAccountExistAndBelongsToVendor ? bankAccountExistAndBelongsToVendor.recipient_id : paystack_recipient.id;
        bank.vendor_id = vendor.id;
        bank.user_id = vendor.owner_id;
        bank.account_number = paystack_recipient.details.account_number;
        bank.bank_id = verified_bank_details.bank_id;
        await bank.save();
        vendor.has_bank_account = true;
        await vendor.save()
        return successResponse('bank details created successfully')
    }


    async findOne(user: User, vendorId?: string): Promise<BankAccount | undefined> {
        const condition = {}
        if (vendorId) {
            condition['vendor_id'] = vendorId;
        } else {
            condition['user_id'] = user.id;
        }
        return await BankAccount.findOne({where: condition})
    }

    async update(bankId: string, user: User, updateBankAccountDto: UpdateBankAccountDto) {
        const {account_number, bank_code, bank_name, vendor_id} = updateBankAccountDto;
        const verified_bank_details = await verifyBankAccount(account_number, bank_code);
        const bank = await BankAccount.findOne({where: {id: bankId}});
        if (!bank) returnErrorResponse('bank does not exist')

        if (bank.account_number !== account_number) {
            const paystack_recipient = await createTransferRecipient(account_number, verified_bank_details.account_name, bank_code);
            bank.bank_name = bank_name;
            bank.bank_code = bank_code;
            bank.recipient_code = paystack_recipient.recipient_code;
            bank.account_name = verified_bank_details.account_name;
            bank.auth_code = paystack_recipient.details.authorization_code;
            bank.currency = paystack_recipient.currency;
            bank.email = paystack_recipient.email;
            bank.recipient_id = paystack_recipient.id;
            if (vendor_id) {
                bank.vendor_id = vendor_id;
            } else {
                bank.user_id = user.id;
            }
            bank.account_number = paystack_recipient.details.account_number;
            bank.bank_id = verified_bank_details.bank_id;
            await bank.save();
        }
        return successResponse('bank details updated successfully')
    }

    remove(id: number) {
        return `This action removes a #${id} bankAccount`;
    }
}
