import { IsEmail, IsInt, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../../enums/role.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {

  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @IsNotEmpty()
  @IsString()
  readonly gender: string;

  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;

   role: Role;

  @IsNotEmpty()
  readonly phone_number: string;


}

export class ChangePassword {
  @IsNotEmpty()
  password:string

  @IsNotEmpty()
  confirm_password:string

  @IsNotEmpty()
  new_password:string
}

