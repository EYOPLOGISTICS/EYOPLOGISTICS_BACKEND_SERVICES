import {HttpStatus, Injectable} from "@nestjs/common";
import {UsersService} from "../users/users.service";
import {returnErrorResponse, successResponse} from "../utils/response";
import {JwtService} from "@nestjs/jwt";
import {OtpService} from "../otp/otp.service";
import {LoginDto, SignUpDto} from "./dto/auth.dto";
import {DOMAIN_TYPE} from "../enums/type.enum";
import {Role} from "../enums/role.enum";
import {User} from "../users/entities/user.entity";
import {RatingsService} from "../ratings/ratings.service";
import {ResetPasswordDto} from "../users/dto/create-user.dto";

const bcrypt = require("bcrypt");

@Injectable()
export class AuthService {
    constructor(private otpService: OtpService, private usersService: UsersService, private jwtService: JwtService, private ratingService: RatingsService,) {
    }

    async login(loginDto:LoginDto): Promise<any> {
        const {password, email} = loginDto;
        // find user with password
        let user = await User.findOne({where:{email}, select:{id:true,password:true, email:true, verified:true}})
        if(!user) returnErrorResponse('User does not exist');
        // compare credentials
        if(!await this.comparePassword(user.password, password)) returnErrorResponse('Invalid credentials')

        if(!user.verified) return successResponse({verified:user.verified, user:null, access_token:null})
        // find user without password
        user = await User.findOne({where:{email}})

        const payload = {sub: user.id, username: user.role};
        const access_token = await this.jwtService.signAsync(payload);
        console.log('logging endpoint successful')
        return successResponse({user, access_token, verified:true});

    }

    async signUp(signUpDto: SignUpDto): Promise<any> {
        const {email, phone_number, first_name, last_name, password, role} = signUpDto;
        if (await User.findOne({where: {email}})) returnErrorResponse('a user with that email already exists')
        if (await User.findOne({where: {phone_number}})) returnErrorResponse('a user with that phone number already exists')
        const user = new User()
        user.email = email;
        user.phone_number = phone_number;
        user.first_name = first_name;
        user.last_name = last_name;
        user.full_name = first_name + last_name;
        user.role = role;
        user.password = await bcrypt.hash(password, 10);
        await user.save()
        await this.otpService.sendOtpToMail(email.trim())
        return successResponse('Otp has been sent to your email');
    }

    async sendOtp(email: string) {
       return await this.otpService.sendOtpToMail(email)
    }

    async verifyOtp(email: string, otp: number) {
        const otpVerified = await this.otpService.verifyOtp(email, otp)
        if (!otpVerified) returnErrorResponse('Invalid OTP')
        const user = await User.findOne({where: {email}, select: {id: true, email: true, verified: true}})
        if (!user.verified) {
            user.verified = true;
            await user.save();
        }
        return successResponse('email verified successfully')

    }

    async resetPassword(resetPasswordDto:ResetPasswordDto){
        const { confirm_password, new_password, email } = resetPasswordDto;
        if (confirm_password !== new_password) returnErrorResponse("password dont match");
        const user = await User.findOne({where:{email}, select:{id:true,email:true, password:true}})
        if (!user) returnErrorResponse("User does not exist");
        user.password = await bcrypt.hash(new_password, 10);
        await user.save();
        return successResponse("password reset successfully");
    }

    async comparePassword(hashedPassword: string, password: string): Promise<any> {
        return await bcrypt.compare(
            password,
            hashedPassword
        );

    }
}
