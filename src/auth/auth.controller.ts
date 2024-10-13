import {Body, Controller, Get, HttpStatus, Post, Res} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AuthPusherDto, GetStartedDto, LoginDto} from "./dto/auth.dto";
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
import {sendWhatsAppMessage} from "../services/sms";
import {RatingsService} from "../ratings/ratings.service";
import {GETVERSION} from "../decorators/version.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService, private userService: UsersService, private queueService: QueueService, private ratingService: RatingsService) {
    }

    @Public()
    @ApiOperation({summary: "Get started", description: "Get started with phone number or email"})
    @ApiResponse({status: HttpStatus.OK, type: SuccessResponseType, description: "returns a success message"})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, type: ErrorResponseType})
    @Post("/get-started")
    async handleGetStarted(@DOMAIN() domain: DOMAIN_TYPE, @Body() getStartedDto: GetStartedDto): Promise<SuccessResponseType | ErrorResponseType> {
        await this.authService.handleGetStarted(domain, getStartedDto);
        return successResponse("Otp sent successfully");
    }

    @Public()
    @Post('/send-otp')
    async sendOtp(@Body('phone_number') phone_number: string): Promise<SuccessResponseType | ErrorResponseType> {
        await sendWhatsAppMessage(`${phone_number ?? 2348184989663}`, 'Testing send charm')
        return successResponse("Otp sent successfully");
    }

    @Public()
    @ApiOperation({summary: "Login", description: "Login with otp, phone number or email"})
    @ApiResponse({
        status: HttpStatus.OK,
        type: SuccessResponseType,
        description: "returns the user data with an access token"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        type: ErrorResponseType,
        description: "Invalid request or validation errors"
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        type: ErrorResponseType,
        description: "User does not exist"
    })
    @Post("login")
    signIn(@Body() loginDto: LoginDto, @DOMAIN() domain: DOMAIN_TYPE) {
        const {email, phone_number, otp} = loginDto;
        console.log("hitting login endpoint");
        return this.authService.login(domain, parseInt(otp), email.trim(), phone_number);
    }


    @Post("/pusher")
    @ApiOperation({
        summary: "Pusher authentication",
        description: "pusher authentication endpoint for private channels"
    })
    authoriseUserWithPusher(@Res() res, @Body() authPusherDto: AuthPusherDto, @DOMAIN() domain: DOMAIN_TYPE, @GETVERSION() version) {
        const pusher = usePusher();
        const socketId = authPusherDto.socket_id;
        const channel = authPusherDto.channel_name;
        const authResponse = pusher.authorizeChannel(socketId, channel);
        console.log(domain === DOMAIN_TYPE.RIDER && !version ? authResponse : successResponse(authResponse))
        res.send(domain === DOMAIN_TYPE.RIDER && !version ? authResponse : successResponse(authResponse));
    }


    @Get("user")
    async isLoggedIn(@AuthUser() user: User) {
        const {total_rating} = await this.ratingService.getRiderRatingStats(user.id)
        user['rating'] = total_rating;
        return successResponse({user, is_logged_in: true});
    }
}
