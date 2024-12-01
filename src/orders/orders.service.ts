import {Injectable} from '@nestjs/common';
import {CheckOutDto, CreateOrderDto, OrderSearchDto} from './dto/create-order.dto';
import {User} from "../users/entities/user.entity";
import {Cart} from "../cart/entities/cart.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {Order} from "./entities/order.entity";
import {ORDER_STATUS, ORDER_TIMELINE, PAYMENT_METHOD, PAYMENT_STATUS, SHIPPING_METHOD} from "../enums/type.enum";
import {Card} from "../cards/entities/card.entity";
import usePaystackService from "../services/paystack";
import {useGoogleMapServices} from "../services/map";
import {Vendor} from "../vendors/entities/vendor.entity";
import {generateTrackingCode, getPaystackFee} from "../utils";
import {PaginationDto} from "../decorators/pagination-decorator";
import {Timeline} from "./entities/timeline.entity";
import {OrderTimeline} from "./entities/order_timeline.entity";
import {OrderProduct} from "./entities/order-products.entity";

const {chargeCard} = usePaystackService;

@Injectable()
export class OrdersService {
    async create(createOrderDto: CreateOrderDto, user: User) {
        const {payment_method, destination, shipping_address, cart_id, card_id, shipping_method} = createOrderDto;
        const shipping_location = destination;
        const cart = await Cart.findOne({
            where: {id: cart_id, user_id: user.id},
            relations: {cart_products: {product: true}}
        })

        if (!cart) returnErrorResponse('Could not find cart')
        // get vendor
        const vendor = await Vendor.findOne({where: {id: cart.vendor_id}})
        if (!vendor) returnErrorResponse('Vendor does not exist')
        // ensure products ordered aren't out of stock
        for (const cartProduct of cart.cart_products) {
            if (cartProduct.product.quantity === 0) returnErrorResponse(`This product(${cartProduct.product.name}) is out of stock`)
            if (cartProduct.product.quantity < cartProduct.product_quantity) returnErrorResponse(`Vendor only has ${cartProduct.product.quantity} left of ${cartProduct.product.name}`)
        }
        // check if there is already an order
        let order = await Order.findOne({where: {cart_id, user_id: user.id}})
        if (!order) {
            // create a new order
            order = new Order();
            order.user_id = user.id;
            order.cart_id = cart_id;
        }
        order.card_id = card_id;
        order.vendor_id = cart.vendor_id;
        order.payment_method = payment_method;
        order.shipping_address = shipping_address;
        order.shipping_location = shipping_location;
        order.shipping_location = shipping_location;
        order.tracking_id = generateTrackingCode().toString();
        order.shipping_method = shipping_method;
        order.cart_total = cart.total;
        // calculate delivery fee
        const {service_fee, delivery_fee, total, km, duration} = await this.checkout({
            origin: vendor.location,
            destination: shipping_location,
            amount: order.cart_total,
            shipping_method
        })
        console.log(service_fee)
        console.log(delivery_fee)
        order.service_fee = service_fee;
        order.delivery_fee = delivery_fee;
        order.order_total = total;
        order.km = km;
        order.duration = duration;
        order.discount = cart.total_discount;
        await order.save();

        await OrderProduct.delete({order_id: order.id})
        // save ordered products
        for (const cartProduct of cart.cart_products) {
            const orderProduct = new OrderProduct();
            orderProduct.order_id = order.id;
            orderProduct.product_name = cartProduct.product.name;
            orderProduct.product_cost_price = cartProduct.product.cost_price;
            orderProduct.product_selling_price = cartProduct.product.selling_price;
            orderProduct.product_quantity = cartProduct.product_quantity;
            orderProduct.product_discount = parseInt(cartProduct.product_discount);
            orderProduct.product_id = cartProduct.product_id;
            orderProduct.product_image = cartProduct.product.image_url;
            orderProduct.total = cartProduct.total;
            await orderProduct.save();
        }
        if (payment_method === PAYMENT_METHOD.CARD) {
            const card = await Card.findOne({where: {id: card_id, user_id: user.id}})
            if (!card) returnErrorResponse('could not find card for payment')
            const charged = await chargeCard(card, order.order_total, user)
            if (!charged) {
                order.payment_status = PAYMENT_STATUS.FAILED;
                returnErrorResponse('Could not charge card')
            }
            order.payment_status = PAYMENT_STATUS.PAID;
            this.processOrder(order)
            await cart.remove();
            return successResponse({
                message: 'Your order has been placed',
                paid: true,
                payment_method: order.payment_method,
                payment_url: null,
                reference: null
            })
        }
        // generate online payment url from paystack
        const paystackResponse = await usePaystackService.initializeTransaction(user.email, order.order_total, {
            'order_id': order.id,
            'transaction_type': 'order.pay'
        }, ['ussd', 'bank_transfer', 'card'])

        return successResponse({
            message: 'Your order has been submitted',
            paid: false,
            payment_method: order.payment_method,
            payment_url: paystackResponse.authorization_url,
            reference: paystackResponse.reference
        })

    }

    async createOrderTimeline(order: Order) {
        const timelines = await Timeline.find({order: {order: 'ASC'}});
        for (const timeline of timelines) {
            const orderTimeline = new OrderTimeline();
            orderTimeline.timeline_id = timeline.id;
            orderTimeline.order_id = order.id;
            if (timeline.order === 1) orderTimeline.status = true;
            await orderTimeline.save();
        }
    }

    async checkout(checkOutDto: CheckOutDto): Promise<{ delivery_fee: number, service_fee: number, total: number, km: number, duration: string }> {
        const {shipping_method, amount, destination, origin} = checkOutDto;
        let deliveryFee = 0;
        let km = 0;
        let duration: string;
        console.log(origin)
        console.log(destination)
        if (shipping_method && shipping_method === SHIPPING_METHOD.HOME_DELIVERY) {
            console.log('home delivery')
            const googleService = useGoogleMapServices()
            const response = await googleService.calculateDeliveryFee(googleService.formatLatAndLng(origin.lat, origin.lng), googleService.formatLatAndLng(destination.lat, destination.lng))
            // console.log(`delivery fee - ${response.delivery_fee}`)
            console.log(`km - ${response.km}`)
            deliveryFee = response.delivery_fee;
            km = response.km;
            duration = response.duration;
        }
        const {applicable_fee, paystack_amount} = getPaystackFee(amount)
        console.log(paystack_amount)
        return {
            delivery_fee: deliveryFee,
            service_fee: applicable_fee,
            total: Math.round(paystack_amount + deliveryFee),
            km,
            duration
        }
    }

    async processOrder(order: Order) {
        order.is_active = true;
        order.status = ORDER_STATUS.ONGOING;
        order.timeline_status = ORDER_TIMELINE.PROCESSING;
        await order.save();
        await this.createOrderTimeline(order)
        // send mail to vendor & customer
    }

    async completeOrder(orderId: string, user:User) {
        const order = await this.findOrder(orderId)
        if (!order) returnErrorResponse('Order does not exist')
        if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.FAILED) returnErrorResponse('Could not complete this action')
        for(const time of order.timelines){
            time.status = true;
            await time.save();
        }
        order.status = ORDER_STATUS.COMPLETED;
        order.is_active = false;
        await order.save();
        return successResponse({order})
    }

    async findOrder(orderId:string):Promise<Order | undefined>{
        return await Order.findOne({
            where: {id: orderId},
            relations: {timelines: true, vendor: true, products: true},
            select: {vendor: {name: true, id: true, verified: true, logo: true}},
            order: {timelines: {timeline: {order: 'ASC'}}}
        })
    }

    async cancelOrder(orderId: string, user:User) {
        const order = await this.findOrder(orderId)
        if (!order) returnErrorResponse('Order does not exist')
        if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.FAILED) returnErrorResponse('Could not complete this action')
        order.status = ORDER_STATUS.CANCELLED;
        order.is_active = false;
        await order.save();
        return successResponse({order})
    }


    async customerOrders(user: User, query: OrderSearchDto, pagination: PaginationDto) {
        const {status} = query;
        const conditions = {user_id: user.id}
        if (status) {
            if (status !== ORDER_STATUS.ALL) {
                conditions['status'] = status
            }
        }
        console.log(conditions)
        const [orders, count] = await Order.findAndCount({
            relations: {timelines: true, vendor: true, products: true, rating:true},
            select: {vendor: {name: true, id: true, verified: true, logo: true}},
            where: conditions,
            order: {created_at: 'DESC'},
            skip: pagination.offset,
            take: pagination.limit
        })
        return successResponse({orders, total_rows: count})
    }

    async vendorsOrders(vendorId: string, query: OrderSearchDto, pagination: PaginationDto) {
        const {status} = query;
        const conditions = {vendor_id: vendorId}
        if (status) {
            if (status !== ORDER_STATUS.ALL) {
                conditions['status'] = status
            }
        }
        const [orders, count] = await Order.findAndCount({
            relations:{products:true, timelines:true},
            where: conditions,
            order: {created_at: 'DESC'},
            skip: pagination.offset,
            take: pagination.limit
        })
        return successResponse({orders, total_rows: count})
    }

    async findOne(orderId: string) {
        const order = await Order.findOne({where: {id: orderId}})
        if (!order) returnErrorResponse('order does not exist')
    }

    async remove(id: string) {
        return `This action removes a #${id} order`;
    }
}
