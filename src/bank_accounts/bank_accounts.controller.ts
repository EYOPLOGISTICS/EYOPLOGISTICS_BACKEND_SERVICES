import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import {BankAccountsService} from './bank_accounts.service';
import {CreateBankAccountDto} from './dto/create-bank_account.dto';
import {UpdateBankAccountDto} from './dto/update-bank_account.dto';
import {AppDto} from "../app.dto";
import {successResponse} from "../utils/response";
import usePaystackService from "../services/paystack";
import {AuthUser} from "../decorators/user.decorator";
import {User} from "../users/entities/user.entity";
import {GetVendor} from "../decorators/vendor.decorator";
import {Vendor} from "../vendors/entities/vendor.entity";

const {verifyBankAccount, getNigerianBanks} = usePaystackService;

@Controller('bank-accounts')
export class BankAccountsController {
    constructor(private readonly bankAccountsService: BankAccountsService) {
    }

    @Get("/banks-list")
    async handleBanksEndpoint() {
        return successResponse({banks: await getNigerianBanks(), message: "success"});
    }

    @Get("/resolve")
    async verifyBankAccount(@Query() data: AppDto) {
        const {account_number, bank_code} = data;
        const response = await verifyBankAccount(account_number, bank_code);
        return successResponse({account_name: response.account_name, message: "verified"});
    }

    @Post()
    create(@GetVendor() vendor:Vendor, @Body() createBankAccountDto: CreateBankAccountDto, @AuthUser() user: User) {
        return this.bankAccountsService.create(user, createBankAccountDto, vendor);
    }


    @Get()
    findOne(@AuthUser() user: User) {
        return this.bankAccountsService.findOne(user);
    }

    @Patch(':bank_account_id')
    update(@Param('bank_account_id') id: string, @Body() updateBankAccountDto: UpdateBankAccountDto, @AuthUser() user: User) {
        return this.bankAccountsService.update(id, user, updateBankAccountDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bankAccountsService.remove(+id);
    }
}
