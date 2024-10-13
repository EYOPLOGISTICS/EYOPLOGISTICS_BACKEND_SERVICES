import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
    RawBodyRequest,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import {AppService} from "./app.service";
import {returnErrorResponse, successResponse} from "./utils/response";
import {AppDto, EnableNotificationDto} from "./app.dto";
import {ApiConsumes, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {SuccessResponseType} from "./enums/type.enum";
import {Public} from "./decorators/public-endpoint.decorator";
import {TransactionsService} from "./transactions/transactions.service";
import usePaystackService from "./services/paystack";
import {getPaystackFee} from "./utils";
import {AdminService} from "./admin/services/admin.service";
import {useGoogleMapServices} from "./services/map";
import {Request} from "express";
const stripe = require('stripe')('sk_test_51PXnWmRuYEIazKf9pR04SAcOuB7hvVHOWU6F1u08LHUjHPylcRpCyzWrmeBvDq9qBvFHWrWTXytBBGj7y9zSwn7400kI8AGnlV');
const googleMapServices = useGoogleMapServices();

const {verifyBankAccount, getNigerianBanks, authenticate} = usePaystackService;
const logger = require("./utils/logger");

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private transactionService: TransactionsService, private adminService: AdminService) {
    }

    @ApiOperation({summary: "Get all nigerian banks"})
    @ApiResponse({
        status: HttpStatus.OK,
        type: SuccessResponseType,
        description: "returns a success message with the list banks"
    })
    @Get("/banks")
    async handleBanksEndpoint() {
        return successResponse({banks: await getNigerianBanks(), message: "success"});
    }


    @ApiOperation({summary: "Verify bank account"})
    @ApiConsumes("multipart/form-data")
    @ApiResponse({
        status: HttpStatus.OK,
        type: SuccessResponseType,
        description: "returns a success message with the verified account name"
    })
    @Get("/bank/resolve")
    async verifyBankAccount(@Query() data: AppDto) {
        const {account_number, bank_code} = data;
        const response = await verifyBankAccount(account_number, bank_code);
        return successResponse({account_name: response.account_name, message: "verified"});
    }

    @Public()
    @Post("/paystack/webhook")
    webHookHandler(@Res() res, @Req() req) {
        const body = req.body;
        logger.error(JSON.stringify(body));
        logger.error(`first webhook`);
        if (authenticate(body, req.headers["x-paystack-signature"])) {
            console.log("authenticated");
            logger.error(`webhook data ${JSON.stringify(body)}`);
            this.transactionService.webhookServiceHandler(body);
        } else {
            console.log("not authenticated");
        }
        res.sendStatus(200);
    }

    @Public()
    @Post("/stripe/webhook")
    stripeWebHookHandler(@Res() res, @Req() req: RawBodyRequest<Request>) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
        } catch (err) {
            console.log(err)
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        // console.log(`Unhandled event type ${event.type}`);
         this.transactionService.stripeWebhookHandler(event)
        // Return a 200 response to acknowledge receipt of the event
        res.send();
    }

    @Public()
    @Post("/stripe/webhook/connect")
    stripeConnectWebHookHandler(@Res() res, @Req() req: RawBodyRequest<Request>) {
        const secret = process.env.STRIPE_WEBHOOK_CONNECT_SECRET_KEY;
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
        } catch (err) {
            console.log(err)
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        // console.log(`Unhandled event type ${event.type}`);
        this.transactionService.stripeWebhookHandler(event)
        // Return a 200 response to acknowledge receipt of the event
        res.send();
    }


    @Public()
    @Get("/paystack/callback")
    paystackCallback(@Res() res, @Req() req) {
        const body = req.body;
        logger.error(`paystack callback ${body}`);
        res.sendStatus(200);
    }

    @ApiOperation({summary: "Calculate paystack fee"})
    @ApiResponse({
        status: HttpStatus.OK,
        type: SuccessResponseType,
        description: "returns a success message with calculated amount"
    })
    @Public()
    @Get("/calculator")
    calculator(@Query("amount") amount: number) {
        const {paystack_amount, applicable_fee} = getPaystackFee(amount);
        return successResponse({paystack_fee: applicable_fee, paystack_amount: Math.round(paystack_amount)});
    }



}
