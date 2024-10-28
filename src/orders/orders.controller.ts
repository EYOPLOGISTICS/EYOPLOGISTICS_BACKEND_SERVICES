import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import {OrdersService} from './orders.service';
import {CheckOutDto, CreateOrderDto, OrderSearchDto} from './dto/create-order.dto';
import {UpdateOrderDto} from './dto/update-order.dto';
import {AuthUser} from "../decorators/user.decorator";
import {User} from "../users/entities/user.entity";
import {successResponse} from "../utils/response";
import {ORDER_STATUS} from "../enums/type.enum";
import {GetPagination, PaginationDto} from "../decorators/pagination-decorator";
import {GetVendorId} from "../decorators/vendor.decorator";

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {
    }

    @Post('/checkout')
    async checkout(@Body() checkOutDto: CheckOutDto) {
        const {service_fee, total, km, delivery_fee, duration} = await this.ordersService.checkout(checkOutDto)
        return successResponse({service_fee, total, km, delivery_fee, duration})
    }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @AuthUser() user: User) {
        return this.ordersService.create(createOrderDto, user);
    }

    @Get('/customer')
    customerOrders(@AuthUser() user:User, @Query() query:OrderSearchDto, @GetPagination() pagination:PaginationDto) {
        return this.ordersService.customerOrders(user, query, pagination);
    }

    @Get('/vendor')
    vendorOrders(@GetVendorId() vendorId:string, @Query() query:OrderSearchDto, @GetPagination() pagination:PaginationDto) {
        return this.ordersService.vendorsOrders(vendorId, query, pagination);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

}
