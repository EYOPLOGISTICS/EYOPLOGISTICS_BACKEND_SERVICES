import {IsEnum, IsNotEmpty, ValidateIf, ValidateNested} from "class-validator";
import {ORDER_STATUS, PAYMENT_METHOD, SHIPPING_METHOD} from "../../enums/type.enum";
import {ApiProperty} from "@nestjs/swagger";
import {MapDto} from "../../vendors/dto/create-vendor.dto";
import {PaginationDto} from "../../decorators/pagination-decorator";
export class CreateOrderDto {
    @IsNotEmpty()
    @ApiProperty({enum:PAYMENT_METHOD})
    @IsEnum(PAYMENT_METHOD)
    payment_method:PAYMENT_METHOD

    @ValidateIf((payload) => payload.payment_method === PAYMENT_METHOD.CARD)
    @IsNotEmpty({message:'card is required'})
    card_id:string

    @IsNotEmpty()
    cart_id:string

    @IsNotEmpty()
    @ValidateNested()
    destination:MapDto

    @IsNotEmpty()
    shipping_address:string

    @IsNotEmpty()
    @ApiProperty({enum:SHIPPING_METHOD})
    @IsEnum(SHIPPING_METHOD)
    shipping_method:SHIPPING_METHOD

}

export class CheckOutDto {
    origin:MapDto
    destination:MapDto
    amount:number

    @IsEnum(SHIPPING_METHOD)
    shipping_method?:SHIPPING_METHOD
}

export class OrderSearchDto extends PaginationDto{
    @ApiProperty({enum:ORDER_STATUS})
    @IsEnum(ORDER_STATUS)
    status?:ORDER_STATUS
}
