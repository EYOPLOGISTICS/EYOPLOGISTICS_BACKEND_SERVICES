import { IsNotEmpty } from "class-validator";

export class AppDto{
  @IsNotEmpty()
  account_number:string;

  @IsNotEmpty()
  bank_code:string;
}

export class EnableNotificationDto{
  @IsNotEmpty()
  external_id:string;
}