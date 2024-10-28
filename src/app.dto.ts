import { IsNotEmpty } from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

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

export class UploadFileDto{
  @ApiProperty({ type: "string", format: "binary" })
  file: string;
}