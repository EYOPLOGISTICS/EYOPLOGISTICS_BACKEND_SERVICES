import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export enum TRIP_STATUS {
  PENDING = "pending",
  FINDING_DRIVERS = "finding_drivers",
  ACCEPTED = "accepted",
  ONGOING = "has_started",
  ARRIVED = "driver_arrived",
  COMPLETED = "completed",
  CANCELED = "canceled",
  ALL = "all",
  SCHEDULED = "scheduled",
  RECURRING = "recurrent",
  UPCOMING = "upcoming",
}


export enum OFFER_STATUS {
  PENDING = "pending",
  ACCEPTED = "accepted",
}

export enum TRANSACTION_TYPE {
  DEBIT = "debit",
  CREDIT = "credit",

  TRANSFER = "TRANSFER",
}

export enum PAYSTACK_WEBHOOK_EVENTS {
  CHARGE_SUCCESS = "charge.success",
  TRANSFER_REVERSED = "transfer.reversed",
  TRANSFER_SUCCESS = "transfer.success",

  TRANSFER_FAILED = "transfer.failed",
}


export enum TRANSACTION_METHOD {
  WALLET = "wallet",
  CARD = "card",
  TRANSFER = "transfer",

  WITHDRAWAL = "withdrawal",

  PAYSTACK = "paystack",
  BANK = "bank",
  USSD = "ussd",

  CASH = "cash"
}

export enum PAYMENT_TYPE {
  WALLET = "wallet",

  CASH = "cash",

  CARD = 'card'
}



export enum DOMAIN_TYPE {
  DRIVER = "DR",
  RIDER = "RR",
  ADMIN = "AN"
}

export enum STATUS {
  FAILED = "failed",
  SUCCESS = "success",
  PENDING = "pending",
  INCOMPLETE = "incomplete",

  PAID = "paid"
}

export enum CURRENCIES {
  NAIRA = "NGN",
  EURO = "EUR",
  DOLLAR = "USD"
}


export class SuccessResponseType {
  @ApiProperty()
  data: any;
  @ApiProperty()
  status: HttpStatus;
  @ApiProperty()
  success: boolean;

}

export class SendEmailType {
  to: string;
  subject: string;
  context?: object;
  template: string;
  bcc?: string;
  cc?: string;

}

export class ErrorResponseType {
  @ApiProperty()
  status: HttpStatus;
  @ApiProperty()
  success: false;
  @ApiProperty()
  data: object | [];
  @ApiProperty()
  errors: any;
  @ApiProperty()
  timestamp: Date;
  @ApiProperty()
  path: string;
  @ApiProperty()
  message: string;
}
