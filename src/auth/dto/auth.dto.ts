import {IsEmail, IsNotEmpty, IsNumber, IsString, ValidateIf} from "class-validator";
import {Transform, TransformFnParams} from "class-transformer";


export class LoginDto {
    // @ValidateIf((data) => !data.phone_number)
    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;

    // @ValidateIf((data) => !data.email)
    @IsNotEmpty({message:'please input a valid phone number'})
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @Transform(({value}) => {
        if (typeof value === 'string') {
            return parseInt(value)
        }
    })
    otp: string;

    password?: string;

}

export class AdminLoginDto {
    // @ValidateIf((data) => !data.phone_number)
    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;


    @IsNotEmpty()
    password?: string;

}

export class AuthPusherDto {
    @IsNotEmpty()
    socket_id: string;

    @IsNotEmpty()
    channel_name: string;

}

export class GetStartedDto {
    // @ValidateIf((data) => !data.phone_number)
    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;

    // @ValidateIf((data) => !data.email)
    @IsNotEmpty({message:'Please input a valid phone number'})
    @IsString()
    // @Transform(({value}) => value.trim().toLowerCase())
    phone_number: string;
}
