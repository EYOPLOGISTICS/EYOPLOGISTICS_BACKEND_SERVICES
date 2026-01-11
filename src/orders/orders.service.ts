import { Injectable } from '@nestjs/common';
import {
  CheckOutDto,
  CreateOrderDto,
  OrderSearchDto,
} from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { returnErrorResponse, successResponse } from '../utils/response';
import { Order } from './entities/order.entity';
import {
  ORDER_STATUS,
  ORDER_TIMELINE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SHIPPING_METHOD,
  TRANSACTION_METHOD,
  TRANSACTION_TYPE,
} from '../enums/type.enum';
import { Card } from '../cards/entities/card.entity';
import usePaystackService from '../services/paystack';
import { useGoogleMapServices } from '../services/map';
import { Vendor } from '../vendors/entities/vendor.entity';
import { calDiscount, generateTrackingCode, getPaystackFee } from '../utils';
import { PaginationDto } from '../decorators/pagination-decorator';
import { Timeline } from './entities/timeline.entity';
import { OrderTimeline } from './entities/order_timeline.entity';
import { OrderProduct } from './entities/order-products.entity';
import { BankAccount } from '../bank_accounts/entities/bank_account.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { UseOneSignal } from '../services/one-signal';
import { QueueService } from '../queues/queue.service';
import { usePusher } from '../services/pusher';
import { Transaction } from '../transactions/entities/transaction.entity';

const { chargeCard } = usePaystackService;

@Injectable()
export class OrdersService {
  constructor(
    private transactionService: TransactionsService,
    private queueService: QueueService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    let totalProfit = 0;
    let totalProductSold = 0;
    const {
      payment_method,
      destination,
      shipping_address,
      cart_id,
      card_id,
      shipping_method,
    } = createOrderDto;
    const shipping_location = destination;
    const cart = await Cart.findOne({
      where: { id: cart_id, user_id: user.id },
      relations: { cart_products: { product: true } },
    });

    if (!cart) returnErrorResponse('Could not find cart');
    // get vendor
    const vendor = await Vendor.findOne({ where: { id: cart.vendor_id } });
    if (!vendor) returnErrorResponse('Vendor does not exist');
    // ensure products ordered aren't out of stock
    for (const cartProduct of cart.cart_products) {
      if (cartProduct.product.quantity === 0)
        returnErrorResponse(
          `This product(${cartProduct.product.name}) is out of stock`,
        );
      if (cartProduct.product.quantity < cartProduct.product_quantity)
        returnErrorResponse(
          `Vendor only has ${cartProduct.product.quantity} left of ${cartProduct.product.name}`,
        );
    }
    // check if there is already an order
    let order = await Order.findOne({ where: { cart_id, user_id: user.id } });
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
    order.tracking_id = `#${generateTrackingCode().toString()}`;
    order.shipping_method = shipping_method;
    order.cart_total = cart.total;
    // calculate delivery fee
    const { service_fee, delivery_fee, total, km, duration } =
      await this.checkout({
        origin: vendor.location,
        destination: shipping_location,
        amount: order.cart_total,
        shipping_method,
      });
    console.log(service_fee);
    console.log(delivery_fee);
    order.service_fee = service_fee;
    order.delivery_fee = delivery_fee;
    order.order_total = total;
    order.km = km;
    order.duration = duration ?? '0';
    order.discount = cart.total_discount;
    await order.save();

    await OrderProduct.delete({ order_id: order.id });
    // save ordered products
    for (const cartProduct of cart.cart_products) {
      const orderProduct = new OrderProduct();
      orderProduct.order_id = order.id;
      orderProduct.vendor_id = vendor.id;
      orderProduct.product_name = cartProduct.product.name;
      orderProduct.product_cost_price = cartProduct.product.cost_price;
      orderProduct.product_selling_price = cartProduct.product.selling_price;
      orderProduct.product_quantity = cartProduct.product_quantity;
      orderProduct.product_discount = parseInt(cartProduct.product_discount);
      orderProduct.product_id = cartProduct.product_id;
      orderProduct.product_image = cartProduct.product.image_url;
      const profit =
        (cartProduct.product.selling_price - cartProduct.product.cost_price) *
        cartProduct.product_quantity;
      orderProduct.profit = cartProduct.product.discount
        ? calDiscount(profit, cartProduct.product.discount)
        : profit;
      orderProduct.total = cartProduct.total;
      totalProfit = orderProduct.profit;
      totalProductSold += cartProduct.product_quantity;
      await orderProduct.save();
    }
    order.total_profit = totalProfit;
    order.total_product_sold = totalProductSold;
    await order.save();
    if (payment_method === PAYMENT_METHOD.CARD) {
      const card = await Card.findOne({
        where: { id: card_id, user_id: user.id },
      });
      if (!card) returnErrorResponse('could not find card for payment');
      const charged = await chargeCard(card, order.order_total, user);
      if (!charged) {
        order.payment_status = PAYMENT_STATUS.FAILED;
        returnErrorResponse('Could not charge card');
      }
      order.payment_status = PAYMENT_STATUS.PAID;
      this.processOrder(order);
      await cart.remove();
      return successResponse({
        message: 'Your order has been placed',
        paid: true,
        payment_method: order.payment_method,
        payment_url: null,
        reference: null,
      });
    }
    // generate online payment url from paystack
    const paystackResponse = await usePaystackService.initializeTransaction(
      user.email,
      order.order_total,
      {
        order_id: order.id,
        transaction_type: 'order.pay',
      },
      ['ussd', 'bank_transfer', 'card'],
    );

    return successResponse({
      message: 'Your order has been submitted',
      paid: false,
      payment_method: order.payment_method,
      payment_url: paystackResponse.authorization_url,
      reference: paystackResponse.reference,
    });
  }

  async createOrderTimeline(order: Order) {
    const timelines = await Timeline.find({ order: { order: 'ASC' } });
    for (const timeline of timelines) {
      const orderTimeline = new OrderTimeline();
      orderTimeline.timeline_id = timeline.id;
      orderTimeline.order_id = order.id;
      if (timeline.order === 1) orderTimeline.status = true;
      await orderTimeline.save();
    }
  }

  async checkout(checkOutDto: CheckOutDto): Promise<{
    delivery_fee: number;
    service_fee: number;
    total: number;
    km: number;
    duration: string;
  }> {
    const { shipping_method, amount, destination, origin } = checkOutDto;
    let deliveryFee = 0;
    let km = 0;
    let duration: string;
    if (shipping_method && shipping_method === SHIPPING_METHOD.HOME_DELIVERY) {
      console.log('home delivery');
      const googleService = useGoogleMapServices();
      const response = await googleService.calculateDeliveryFee(
        googleService.formatLatAndLng(origin.lat, origin.lng),
        googleService.formatLatAndLng(destination.lat, destination.lng),
      );
      // console.log(`delivery fee - ${response.delivery_fee}`)
      console.log(`km - ${response.km}`);
      deliveryFee = response.delivery_fee;
      km = response.km;
      duration = response.duration;
    }
    const { applicable_fee, paystack_amount } = getPaystackFee(amount);
    console.log(paystack_amount);
    return {
      delivery_fee: deliveryFee,
      service_fee: applicable_fee,
      total: Math.round(paystack_amount + deliveryFee),
      km,
      duration,
    };
  }

  async processOrder(order: Order) {
    const onesignal = UseOneSignal();
    order.is_active = true;
    order.status = ORDER_STATUS.ONGOING;
    order.timeline_status = ORDER_TIMELINE.PROCESSING;
    await order.save();
    await this.createOrderTimeline(order);
    // send mail to vendor & customer
    const notifyVendorAndCustomer = async () => {
      const vendor = await Vendor.findOne({
        where: { id: order.vendor_id },
        select: { name: true, id: true, email: true, owner_id: true },
      });
      const customer = await User.findOne({
        where: { id: order.user_id },
        select: { full_name: true, id: true },
      });

      await onesignal.sendNotification(
        'Order Placed',
        `Your order has been placed & forwarded to ${vendor.name}`,
        order.user_id,
        {},
      );
      await onesignal.sendNotification(
        'New Order',
        `Hello ${vendor.name}, You have a new order`,
        vendor.owner_id,
        {},
      );

      await this.queueService.sendMail({
        subject: 'New Order',
        to: vendor.email,
        template: '/VendorOrderPlaced',
        context: {
          vendor_name: vendor.name,
          customer_name: customer.full_name,
          order_id: order.tracking_id,
        },
      });
    };
    notifyVendorAndCustomer();
  }

  async completeOrder(orderId: string, user: User) {
    const onesignal = UseOneSignal();
    const order = await this.findOrder(orderId);
    if (!order) returnErrorResponse('Order does not exist');
    if (
      order.status === ORDER_STATUS.CANCELLED ||
      order.status === ORDER_STATUS.COMPLETED ||
      order.status === ORDER_STATUS.FAILED
    )
      returnErrorResponse('Could not complete this action');
    for (const time of order.timelines) {
      time.status = true;
      await time.save();
    }
    order.status = ORDER_STATUS.COMPLETED;
    order.is_active = false;
    await order.save();
    this.processVendorEarning(order);
    const notify = async () => {
      onesignal.sendNotification(
        'Order Completed',
        'Thank you for using us, hope you were satisfied with our service',
        order.user_id,
        {},
      );

      onesignal.sendNotification(
        'Order Completed',
        `Hello ${order.vendor.name}, ${order.user.full_name} just completed this order(${order.tracking_id})`,
        order.vendor.owner_id,
        {},
      );
      await this.queueService.sendMail({
        subject: 'Order Completed',
        to: order.vendor.email,
        template: '/OrderCompletedVendor',
        context: {
          vendor_name: order.vendor.name,
          customer_name: order.user.full_name,
          order_id: order.tracking_id,
        },
      });
    };
    notify();
    return successResponse({ order });
  }

  async processVendorEarning(order: Order) {
    const vendor = await Vendor.findOne({
      where: { id: order.vendor_id },
      select: { balance: true, id: true },
    });
    const transExist = await Transaction.findOne({
      where: { order_id: order.id },
    });
    if (transExist) return;

    const bankAccount = await BankAccount.findOne({
      where: { vendor_id: vendor.id },
    });
    const transferResponse = await usePaystackService.initiateTransfer(
      order.cart_total,
      bankAccount.recipient_code,
    );
    await this.transactionService.create({
      method: TRANSACTION_METHOD.TRANSFER,
      user_id: vendor.id,
      order_id: order.id,
      amount: order.cart_total,
      transfer_id: transferResponse.id,
      status: transferResponse.status,
      title: `Order Payout to ${bankAccount.account_name}`,
      type: TRANSACTION_TYPE.TRANSFER,
      payment_reference: transferResponse.reference,
    });
  }

  async findOrder(orderId: string): Promise<Order | undefined> {
    return await Order.findOne({
      where: { id: orderId },
      relations: { timelines: true, vendor: true, products: true, user: true },
      select: {
        vendor: {
          name: true,
          id: true,
          verified: true,
          logo: true,
          owner_id: true,
          email: true,
        },
        user: {
          full_name: true,
          id: true,
          profile_picture: true,
          email: true,
          phone_number: true,
        },
      },
      order: { timelines: { timeline: { order: 'ASC' } } },
    });
  }

  async cancelOrder(orderId: string, user: User) {
    const order = await this.findOrder(orderId);
    if (!order) returnErrorResponse('Order does not exist');
    if (
      order.status === ORDER_STATUS.CANCELLED ||
      order.status === ORDER_STATUS.COMPLETED ||
      order.status === ORDER_STATUS.FAILED
    )
      returnErrorResponse('Could not complete this action');
    order.status = ORDER_STATUS.CANCELLED;
    order.is_active = false;
    await order.save();
    return successResponse({ order });
  }

  async updateOrderTimeline(orderTimelineId: string, vendorId: string) {
    const pusher = usePusher();
    const orderTimeline = await OrderTimeline.findOne({
      where: { id: orderTimelineId },
    });
    if (!orderTimeline) returnErrorResponse('Timeline does not exist');
    let order = await this.findOrder(orderTimeline.order_id);
    if (!order) returnErrorResponse('Order does not exist');
    if (order.status != ORDER_STATUS.ONGOING) {
      return successResponse({ order });
    }
    orderTimeline.status = !orderTimeline.status;
    await orderTimeline.save();
    order = await this.findOrder(orderTimeline.order_id);
    await pusher.trigger(`order-track-${order.id}`, 'order-timeline-change', {
      order_id: order.id,
    });
    return successResponse({ order });
  }

  async customerOrders(
    user: User,
    query: OrderSearchDto,
    pagination: PaginationDto,
  ) {
    const { status } = query;
    const conditions = {
      user_id: user.id,
      payment_status: PAYMENT_STATUS.PAID,
    };
    if (status) {
      if (status !== ORDER_STATUS.ALL) {
        conditions['status'] = status;
      }
    }
    const [orders, count] = await Order.findAndCount({
      relations: {
        timelines: true,
        vendor: true,
        products: true,
        rating: true,
      },
      select: { vendor: { name: true, id: true, verified: true, logo: true } },
      where: conditions,
      order: { created_at: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return successResponse({ orders, total_rows: count });
  }

  async allOrders(
    user: User,
    query: OrderSearchDto,
    pagination: PaginationDto,
  ) {
    const { status } = query;
    const conditions = {};
    if (status) {
      if (status !== ORDER_STATUS.ALL) {
        conditions['status'] = status;
      }
    }

    const totalCompletedOrders = await Order.count({where:{status:ORDER_STATUS.COMPLETED}})
    const totalCancelledOrders = await Order.count({where:{status:ORDER_STATUS.CANCELLED}})
    const totalFailedOrders = await Order.count({where:{status:ORDER_STATUS.FAILED}})

    const [orders, count] = await Order.findAndCount({
      relations: {
        timelines: true,
        vendor: true,
        products: true,
        rating: true,
        user: true,
      },
      select: {
        vendor: { name: true, id: true, verified: true, logo: true },
        user: { full_name: true, id: true, profile_picture: true },
      },
      where: conditions,
      order: { created_at: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return successResponse({ orders, total_rows: count });
  }

  async viewOrder(orderId: string) {
    const order = await Order.findOne({
      relations: {
        timelines: true,
        vendor: true,
        products: true,
        rating: true,
        user: true,
      },
      select: {
        vendor: { name: true, id: true, verified: true, logo: true },
        user: { full_name: true, id: true, profile_picture: true },
      },
      where: { id: orderId },
    });
    if (!order) returnErrorResponse('Order does not exist');
    return successResponse({ order });
  }

  async vendorsOrders(
    vendorId: string,
    query: OrderSearchDto,
    pagination: PaginationDto,
  ) {
    const { status } = query;
    const conditions = {
      vendor_id: vendorId,
      payment_status: PAYMENT_STATUS.PAID,
    };
    if (status) {
      if (status !== ORDER_STATUS.ALL) {
        conditions['status'] = status;
      }
    }
    const [orders, count] = await Order.findAndCount({
      relations: { products: true, timelines: true, user: true },
      select: {
        user: {
          id: true,
          full_name: true,
          phone_number: true,
        },
      },
      where: conditions,
      order: { created_at: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return successResponse({ orders, total_rows: count });
  }

  async findOne(orderId: string) {
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) returnErrorResponse('order does not exist');
  }

  async remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
