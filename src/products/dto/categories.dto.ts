import {IsNotEmpty} from "class-validator";

export class CreateCategoryDto {
    @IsNotEmpty()
    name:string

    image?:string
}

export class CreateVendorCategoryDto {
    @IsNotEmpty()
    name:string

    image?:string
}

export class CreateSubCategoryDto {
    @IsNotEmpty()
    name:string

    @IsNotEmpty()
    image:string

    @IsNotEmpty()
    category_id:string
}
