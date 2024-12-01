import {ArrayMaxSize, ArrayNotEmpty, IsArray, IsNotEmpty} from "class-validator";
import {PaginationDto} from "../../decorators/pagination-decorator";

export class CreateProductDto {
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

    @IsNotEmpty()
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

export class SearchProductsDto extends PaginationDto{
    category?:string
    sub_category?:string
    filter:string
    vendor?:string
    start_date?:string
    end_date?:string
    // order?:string
}
