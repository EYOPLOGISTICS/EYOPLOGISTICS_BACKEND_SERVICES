import { IsEnum, IsInt, IsNotEmpty, Max, Min, ValidateIf } from "class-validator";
import { TRANSACTION_METHOD } from "../../enums/type.enum";
import { Transform } from "class-transformer";

export class RateVendorDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  star: number;

  review?: string;

}


export class EarningStatsDto {
  start_date?: string;
  end_date?:string

}


export class TipDriverDto {
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEnum(TRANSACTION_METHOD)
  payment_method: TRANSACTION_METHOD;

  @ValidateIf((value) => value.payment_method === TRANSACTION_METHOD.CARD)
  @IsNotEmpty()
  card_id?: string;

  @IsNotEmpty()
  amount: number;
}
