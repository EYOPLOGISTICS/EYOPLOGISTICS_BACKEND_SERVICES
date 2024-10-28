import {ArrayMaxSize, ArrayNotEmpty, IsArray, IsNotEmpty} from "class-validator";
import {PaginationDto} from "../../decorators/pagination-decorator";

export class CreateProductDto {
    @IsNotEmpty()
    category_slug:string

    @IsNotEmpty()
    sub_category_slug:string

    // @IsNotEmpty({message:'Vendor is required'})
    // vendor_id:string

    @IsNotEmpty()
    name:string

    @IsNotEmpty()
    description:string

    @IsNotEmpty()
    cost_price:number

    @IsNotEmpty()
    quantity:number

    @IsNotEmpty()
    selling_price:number

    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    @ArrayMaxSize(3)
    images:[string]

    discount:number

    vat:number
}

export class SearchProductsDto extends PaginationDto{
    category?:string
    sub_category?:string
    product_name:string
    vendor?:string
    start_date?:string
    end_date?:string
    // order?:string
}
