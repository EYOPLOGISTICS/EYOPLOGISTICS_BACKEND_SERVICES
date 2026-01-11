import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Order } from './orders/entities/order.entity';
import { Vendor } from './vendors/entities/vendor.entity';
import { ORDER_STATUS } from './enums/type.enum';
import { successResponse } from './utils/response';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  onApplicationBootstrap(): any {
    console.log('application bootstrapped');
    // AppSettings.findOneBy({id: 2}).then(value => {
    //     if (!value) {
    //         const appSettings = new AppSettings();
    //         appSettings.save().then(value1 => value1);
    //     }
    // });
  }

  async dashboard() {
    const totalSales = await Order.sum('order_total', {});
    const totalActiveVendors = await Vendor.count({
      where: { is_active: true },
    });
    const totalCompletedOrders = await Order.count({
      where: { status: ORDER_STATUS.COMPLETED },
    });
    const totalCancelledOrders = await Order.count({
      where: { status: ORDER_STATUS.CANCELLED },
    });

    const recentOrders = await Order.find({
      order: { created_at: 'DESC' },
      take: 4,
    });

    return successResponse({
      recentOrders,
      totalSales,
      totalActiveVendors,
      totalCancelledOrders,
      totalCompletedOrders,
    });
  }
}
