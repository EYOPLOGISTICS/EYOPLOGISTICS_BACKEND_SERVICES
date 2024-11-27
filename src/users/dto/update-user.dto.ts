import {PartialType} from '@nestjs/mapped-types';
import {CreateUserDto} from './create-user.dto';
import {IsEmail, IsEnum, IsNotEmpty, IsString, ValidateNested} from "class-validator";
import {Role} from "../../enums/role.enum";
import {ApiProperty} from "@nestjs/swagger";
import {Transform} from "class-transformer";
import {PAYMENT_TYPE} from "../../enums/type.enum";
import {MapDto} from "../../vendors/dto/create-vendor.dto";

export class UpdateUserDto {
    @ApiProperty({type: 'string', format: 'binary'})
    profile_picture?: any;

    @IsNotEmpty()
    @IsString()
    readonly first_name: string;

    @IsNotEmpty()
    @IsString()
    readonly last_name: string;

    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    readonly email: string;

    @IsNotEmpty()
    readonly phone_number: string;
    // readonly profile_picture?:string

    @IsNotEmpty()
    readonly country: string;

    @IsNotEmpty()
    readonly city: string;

    readonly address?: string
}


export class UpdatePaymentType {
    @ApiProperty({enum: PAYMENT_TYPE})
    @IsNotEmpty()
    @IsString()
    @IsEnum(PAYMENT_TYPE)
    payment_method: PAYMENT_TYPE;

}

export class UpdateUserLocation {
    @IsNotEmpty()
    @ValidateNested()
    location: MapDto;

    @IsNotEmpty()
    address: string;

}
