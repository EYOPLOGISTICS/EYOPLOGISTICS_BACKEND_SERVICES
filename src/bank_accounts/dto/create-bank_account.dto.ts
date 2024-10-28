import {IsNotEmpty} from "class-validator";

export class CreateBankAccountDto {
    @IsNotEmpty()
    account_number: string;

    @IsNotEmpty()
    bank_code: string;

    @IsNotEmpty()
    bank_name: string;

    vendor_id?:string
}
