import {IsNotEmpty} from "class-validator";

export class CreateCartDto {
    @IsNotEmpty()
    product_id:string

}
