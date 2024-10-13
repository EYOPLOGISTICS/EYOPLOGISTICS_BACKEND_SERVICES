import { CURRENCIES, STATUS, TRANSACTION_METHOD, TRANSACTION_TYPE } from "../../enums/type.enum";
import { IsNotEmpty } from "class-validator";
import { Driver } from "../../drivers/entities/driver.entity";

export class CreateTransactionDto {
  type:TRANSACTION_TYPE;

  transfer_id?:string;
  method:TRANSACTION_METHOD
  status:STATUS

  payment_reference?:string
  user_id:string
  card_id?:string
  currency?:CURRENCIES

  title:string

  amount:number

}


export class VerifyTransactionDto {
  @IsNotEmpty()
  payment_reference:string

}


export class InitializeTransactionDto {
  @IsNotEmpty()
  amount:number

  @IsNotEmpty()
  email:string

  metadata:any

  payment_channels:Array<any>

}

export class InitializeStripeTransactionDto {
  transaction_type:string
  // @IsNotEmpty()
  amount:number

  email:string

  metadata:any

}
