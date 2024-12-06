import {Body, Controller, Get, HttpStatus, Post, Res} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AuthPusherDto, LoginDto, SignUpDto, VerifyOtpDto} from "./dto/auth.dto";
import {Public} from "../decorators/public-endpoint.decorator";
import {UsersService} from "../users/users.service";
import {successResponse} from "../utils/response";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {DOMAIN_TYPE, ErrorResponseType, SuccessResponseType} from "../enums/type.enum";
import {AuthUser} from "../decorators/user.decorator";
import {User} from "../users/entities/user.entity";
import {DOMAIN} from "../decorators/domain.decorator";
import {usePusher} from "../services/pusher";
import {QueueService} from "../queues/queue.service";
import {RatingsService} from "../ratings/ratings.service";
import {ResetPasswordDto} from "../users/dto/create-user.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService, private userService: UsersService, private queueService: QueueService, private ratingService: RatingsService) {
    }

    @Public()
    @Post("/signup")
    signup(@Body() signupDto: SignUpDto): Promise<SuccessResponseType | ErrorResponseType> {
        return this.authService.signUp(signupDto);
    }

    @Public()
    @Post('/otp/send')
    async sendOtp(@Body('email') email:string): Promise<SuccessResponseType | ErrorResponseType> {
        await this.authService.sendOtp(email)
        return successResponse("Otp sent successfully");
    }

    @Public()
    @Post("/otp/verify")
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<SuccessResponseType | ErrorResponseType> {
        return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
    }

    @Public()
    @Post("login")
    signIn(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Public()
    @Post("reset/password")
    resetPassword(@Body() resetPassword: ResetPasswordDto) {
        return this.authService.resetPassword(resetPassword);
    }


    @Post("/pusher")
    @ApiOperation({
        summary: "Pusher authentication",
        description: "pusher authentication endpoint for private channels"
    })
    authoriseUserWithPusher(@Res() res, @Body() authPusherDto: AuthPusherDto) {
        const pusher = usePusher();
        const socketId = authPusherDto.socket_id;
        const channel = authPusherDto.channel_name;
        const authResponse = pusher.authorizeChannel(socketId, channel);
        res.send(successResponse(authResponse));
    }


    @Get("user")
    async isLoggedIn(@AuthUser() user: User) {
        return successResponse({user, is_logged_in: true});
    }
}
