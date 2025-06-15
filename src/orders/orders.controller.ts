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
import {UpdateRatingDto} from "../ratings/dto/update-rating.dto";
import {RateVendorDto} from "../ratings/dto/create-rating.dto";
import {RatingsService} from "../ratings/ratings.service";

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService, private ratingService: RatingsService) {
    }

    @Get("/all")
    orders(@AuthUser() user: User, @Query() query: OrderSearchDto, @GetPagination() pagination: PaginationDto){
        return this.ordersService.allOrders(user, query, pagination);
    }

    @Get("/:orderId")
    viewOrder(@Param("orderId") orderId: string) {
        return this.ordersService.viewOrder(orderId);
    }
    @Post('/checkout')
    async checkout(@Body() checkOutDto: CheckOutDto) {
        const {service_fee, total, km, delivery_fee, duration} = await this.ordersService.checkout(checkOutDto)
        return successResponse({checkout_data: {service_fee, total, km, delivery_fee, duration}})
    }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @AuthUser() user: User) {
        return this.ordersService.create(createOrderDto, user);
    }

    @Post('/ratings/:order_id')
    rateOrder(@AuthUser() user: User, @Body() ratingDto: RateVendorDto, @Param('order_id') orderId: string) {
        return this.ratingService.create(user.id, orderId, ratingDto.star, ratingDto.review)
    }

    @Patch('/cancel/:order_id')
    cancelOrder(@Param('order_id') orderId: string, @AuthUser() user: User) {
        return this.ordersService.cancelOrder(orderId, user);
    }

    @Patch('/complete/:order_id')
    completeOrder(@Param('order_id') orderId: string, @AuthUser() user: User) {
        return this.ordersService.completeOrder(orderId, user);
    }

    @Patch('/timelines/:timeline_id')
    updateOrderTimeline(@Param('timeline_id') timelineId: string, @GetVendorId() vendorId: string) {
        return this.ordersService.updateOrderTimeline(timelineId, vendorId);
    }

    @Get('/customer')
    customerOrders(@AuthUser() user: User, @Query() query: OrderSearchDto, @GetPagination() pagination: PaginationDto) {
        return this.ordersService.customerOrders(user, query, pagination);
    }

    @Get('/vendor')
    vendorOrders(@GetVendorId() vendorId: string, @Query() query: OrderSearchDto, @GetPagination() pagination: PaginationDto) {
        return this.ordersService.vendorsOrders(vendorId, query, pagination);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return successResponse({order: await this.ordersService.findOrder(id)})
    }

}
