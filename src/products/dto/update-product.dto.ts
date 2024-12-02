import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import {IsNotEmpty} from "class-validator";

export class UpdateProductDto {
    @IsNotEmpty()
    category_id:string

    @IsNotEmpty()
    sub_category_id:string

    // @IsNotEmpty({message:'Vendor is required'})
    // vendor_id:string

    @IsNotEmpty()
    name:string

    @IsNotEmpty()
    description:string

    @IsNotEmpty()
    cost_price:number

    image_url:string

    @IsNotEmpty()
    quantity:number

    @IsNotEmpty()
    selling_price:number

    // @IsNotEmpty()
    // @IsArray()
    // @ArrayNotEmpty()
    // @ArrayMaxSize(3)
    // images:[string]

    discount:number

    vat:number
}
