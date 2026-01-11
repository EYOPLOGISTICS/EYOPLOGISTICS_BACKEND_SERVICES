import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from "@nestjs/common";
import { AuthUser } from "../decorators/user.decorator";
import { User } from "../users/entities/user.entity";
import { TransactionsService } from "./transactions.service";
import {
  InitializeStripeTransactionDto,
  InitializeTransactionDto,
  VerifyTransactionDto
} from "./dto/create-transaction.dto";
import { SuccessResponseType } from "../enums/type.enum";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { successResponse } from "../utils/response";
import { Public } from "../decorators/public-endpoint.decorator";
import { GetPagination, PaginationDto } from '../decorators/pagination-decorator';

@ApiTags("Transactions")
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {
  }

  @ApiOperation({ summary: "Get list of user/driver transactions" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseType,
    description: "returns transactions list"
  })
  @Get()
  async findAll(@AuthUser() user: User, @GetPagination() pagination:PaginationDto): Promise<SuccessResponseType> {
    return successResponse(await this.transactionsService.findAll(user, pagination));
  }

  @ApiOperation({ summary: "Verify transaction/payment" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseType,
    description: "returns a boolean value and a message"
  })
  @Post("verify")
  verifyPayments(@AuthUser() user: User, @Body() verifyTransactionDto: VerifyTransactionDto): Promise<SuccessResponseType> {
    return this.transactionsService.verifyTransaction(user, verifyTransactionDto);
  }

  @Public()
  @Post("/get-reference/:reference")
  getReference(@Param("reference") reference) {
    return this.transactionsService.getReference(reference);
  }


  @ApiOperation({ summary: "Initialize transaction/payment" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseType,
    description: "returns a success message with an access code"
  })
  @Post("initialize")
  initializeTransaction(@AuthUser() user: User, @Body() initializeTransactionDto: InitializeTransactionDto): Promise<SuccessResponseType> {
    return this.transactionsService.initializeTransactionDto(user, initializeTransactionDto);
  }


  @ApiOperation({ summary: "Initialize transaction/payment" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseType,
    description: "returns a success message with an access code"
  })
  @Post("stripe/initialize")
  initializeStripeTransaction(@AuthUser() user: User, @Body() initializeStripeTransactionDto: InitializeStripeTransactionDto): Promise<SuccessResponseType> {
    return this.transactionsService.initialiseStripeTransaction(user, initializeStripeTransactionDto);
  }

}
