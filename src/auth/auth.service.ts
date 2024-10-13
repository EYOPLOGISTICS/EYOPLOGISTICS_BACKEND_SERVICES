import {HttpStatus, Injectable} from "@nestjs/common";
import {UsersService} from "../users/users.service";
import {returnErrorResponse, successResponse} from "../utils/response";
import {JwtService} from "@nestjs/jwt";
import {OtpService} from "../otp/otp.service";
import {GetStartedDto} from "./dto/auth.dto";
import {DOMAIN_TYPE} from "../enums/type.enum";
import {Role} from "../enums/role.enum";
import {User} from "../users/entities/user.entity";
import {RatingsService} from "../ratings/ratings.service";
const argon2 = require("argon2");

@Injectable()
export class AuthService {
    constructor(private otpService: OtpService, private usersService: UsersService, private jwtService: JwtService, private ratingService: RatingsService,) {
    }

    async login(domain: DOMAIN_TYPE, otp: number, email: string, phone_number: string): Promise<any> {
        let user;
        let verified = true;
        const role = domain === DOMAIN_TYPE.DRIVER ? Role.DRIVER : Role.RIDER;
        if (parseInt(process.env.SEND_SMS) === 1) {
            console.log('sending otp')
            if (email) {
                verified = await this.otpService.verifyOtp(email, otp);
            } else {
                verified = await this.otpService.verifyOtp(phone_number, otp);
            }
            // check if verification failed
        } else {
            const fakeOtp = parseInt("0000");
            if (otp !== fakeOtp) verified = false;
        }

        if (!verified) returnErrorResponse("Invalid Otp");

        user = await User.findOne({where: {email: email.trim(), phone_number: phone_number.trim()}})
        if (!user) {
            const a_user_with_email = await this.usersService.findOne(email)
            const a_user_with_phone = await this.usersService.findOne(phone_number)
            if (a_user_with_email && !a_user_with_phone) returnErrorResponse(`${email} already exist and ${phone_number} is not the phone number for ${email} account`)
            else if (a_user_with_phone && !a_user_with_email) returnErrorResponse(`${phone_number} already exists and ${email} is not the email for ${phone_number} account`);
            else if (a_user_with_phone && a_user_with_email) returnErrorResponse(`${email} and ${phone_number} belongs to different accounts`);
            user = await this.usersService.createUser(role, email, phone_number);
        }
        user.verified = true;
        await user.save();
        //
        const payload = {sub: user.id, username: user.role};
        const access_token = await this.jwtService.signAsync(payload);
        console.log('logging endpoint successful')

            const {total_rating} = await this.ratingService.getRiderRatingStats(user.id)
            user['rating'] = total_rating;
            console.log('user application')
            return successResponse({user, access_token});

    }

    async adminLogin(domain: DOMAIN_TYPE, email: string, password: string): Promise<any> {
        const role = Role.ADMIN;
        const user = await User.findOne({where: {email, role}})
        if (!user || !user.password) {
            returnErrorResponse("Invalid Credentials", HttpStatus.BAD_REQUEST);
        }
        const match = await this.comparePassword(user.password, password);
        if (!match) {
            returnErrorResponse("Invalid Credentials", HttpStatus.BAD_REQUEST);
        }

        const payload = {sub: user.id, username: user.role};
        const access_token = await this.jwtService.signAsync(payload);
        return successResponse({user, access_token});

    }

    async handleGetStarted(domain: DOMAIN_TYPE, getStartedDto: GetStartedDto): Promise<any> {
        const {email, phone_number} = getStartedDto;
        console.log(email)
        console.log(phone_number)
        if (parseInt(process.env.SEND_SMS) === 1) {
            await this.otpService.sendOtpToMailAndPhoneNumber(email.trim(), phone_number)
        }
        return true;
    }

    isDomainMatchingUserRole(role: Role, domain: DOMAIN_TYPE): boolean {
        return !(role === Role.RIDER && domain !== DOMAIN_TYPE.RIDER || role === Role.DRIVER && domain != DOMAIN_TYPE.DRIVER || role === Role.ADMIN && domain != DOMAIN_TYPE.ADMIN);
    }


    async comparePassword(hashedPassword: string, password: string): Promise<boolean> {
        return await argon2.verify(
            hashedPassword,
            password
        );

    }
}
