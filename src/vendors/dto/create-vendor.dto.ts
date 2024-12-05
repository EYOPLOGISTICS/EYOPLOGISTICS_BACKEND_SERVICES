import {IsNotEmpty, ValidateNested} from "class-validator";
import {PaginationDto} from "../../decorators/pagination-decorator";


export class MapDto {
    @IsNotEmpty()
    lat: string;

    @IsNotEmpty()
    lng: string;
}
export class CreateVendorDto {
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    vendor_category_id: string

    @IsNotEmpty()
    description: string


    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    phone_number: string

    @IsNotEmpty()
    @ValidateNested()
    location: MapDto

    @IsNotEmpty()
    logo: string
}
export class CACDto {
    @IsNotEmpty()
    cac_number: string;
}

export class VendorSearchDto extends PaginationDto{
    category_id?:string
    name?:string
    location?:MapDto
    location_address?:string

}
