import {IsEmail, IsNotEmpty, IsNumber, IsString, ValidateIf, IsEnum, MinLength} from "class-validator";
import {Transform, TransformFnParams} from "class-transformer";
import {Role} from "../../enums/role.enum";


export class LoginDto {
    // @ValidateIf((data) => !data.phone_number)
    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

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

export class VerifyOtpDto {
    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;


    @IsNotEmpty()
    otp: number;
}

export class AuthPusherDto {
    @IsNotEmpty()
    socket_id: string;

    @IsNotEmpty()
    channel_name: string;

}

export class SignUpDto {
    @IsNotEmpty()
    @Transform(({value}) => value.trim().toLowerCase())
    first_name: string;

    @IsNotEmpty()
    @Transform(({value}) => value.trim().toLowerCase())
    last_name: string;

    @IsNotEmpty()
    @IsEmail()
    @Transform(({value}) => value.trim().toLowerCase())
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    // @ValidateIf((data) => !data.email)
    @IsNotEmpty({message:'Please input a valid phone number'})
    // @Transform(({value}) => value.trim().toLowerCase())
    phone_number: string;

    @IsNotEmpty()
    @IsEnum(Role)
    role:Role
}
