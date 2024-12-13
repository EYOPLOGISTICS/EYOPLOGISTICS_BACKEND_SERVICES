import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export enum PAYMENT_METHOD {
  CARD = "card",
  ONLINE = "online",
}

export enum ORDER_TIMELINE {
  PROCESSING = "processing",
}

export enum ORDER_STATUS {
  ALL = "all",
  PENDING = "pending",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed"

}

export enum PAYMENT_STATUS {
  PAID = "paid",
  PENDING = "pending",
  FAILED = "failed",
  REFUNDED = 'refunded'
}
export enum SHIPPING_METHOD {
  WALK_IN = "walk_in",
  HOME_DELIVERY = "home_delivery",
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

export enum TRANSACTION_TYPE {
  CREDIT = "credit",
  DEBIT = "debit",

  TRANSFER = "transfer"
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
