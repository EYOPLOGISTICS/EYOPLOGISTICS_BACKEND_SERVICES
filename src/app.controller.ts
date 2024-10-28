import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param, ParseFilePipe,
    Post,
    Query,
    RawBodyRequest,
    Req,
    Res, UploadedFile, UploadedFiles,
    UseGuards, UseInterceptors
} from "@nestjs/common";
import {AppService} from "./app.service";
import {returnErrorResponse, successResponse} from "./utils/response";
import {AppDto, EnableNotificationDto, UploadFileDto} from "./app.dto";
import {ApiConsumes, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {ErrorResponseType, SuccessResponseType} from "./enums/type.enum";
import {Public} from "./decorators/public-endpoint.decorator";
import {TransactionsService} from "./transactions/transactions.service";
import usePaystackService from "./services/paystack";
import {getPaystackFee} from "./utils";
import {useGoogleMapServices} from "./services/map";
import {Request} from "express";
import {AnyFilesInterceptor, FileInterceptor} from "@nestjs/platform-express";
import {useB2FileUpload} from "./services/file-upload";
const stripe = require('stripe')('sk_test_51PXnWmRuYEIazKf9pR04SAcOuB7hvVHOWU6F1u08LHUjHPylcRpCyzWrmeBvDq9qBvFHWrWTXytBBGj7y9zSwn7400kI8AGnlV');
const googleMapServices = useGoogleMapServices();

const {verifyBankAccount, getNigerianBanks, authenticate} = usePaystackService;
const logger = require("./utils/logger");

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private transactionService: TransactionsService) {
    }

    @Post("upload/file")
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@Body()uploadFileDto:UploadFileDto, @UploadedFile() file: Express.Multer.File) {
        const response = await useB2FileUpload(file.originalname, file.buffer);
        if (!response) returnErrorResponse("Could not upload file");
        return successResponse({ file:response, message: "uploaded file successfully" });
    }

    @Post("upload/files")
    @UseInterceptors(AnyFilesInterceptor())
    async uploadMultipleFiles(@UploadedFiles(new ParseFilePipe({fileIsRequired: true})) files: any): Promise<SuccessResponseType> {
       const tempFileArray = [];
        for (const file of files) {
            const uploaded_url = await useB2FileUpload(file.originalname, file.buffer);
            tempFileArray.push(uploaded_url);
        }
        return successResponse({files:tempFileArray})
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
    @Get("/paystack/callback")
    paystackCallback(@Res() res, @Req() req) {
        const body = req.body;
        logger.error(`paystack callback ${body}`);
        res.sendStatus(200);
    }




}
