import { Injectable } from "@nestjs/common";
import { UpdateRatingDto } from "./dto/update-rating.dto";
import { Rating } from "./entities/rating.entity";
import {Product} from "../products/entities/product.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {Vendor} from "../vendors/entities/vendor.entity";
import {Order} from "../orders/entities/order.entity";


@Injectable()
export class RatingsService {
  async create(userId: string, orderId:string, star: number, review?: string) {
    const order = await Order.findOneBy({id:orderId})
    if(!order) returnErrorResponse('order does not exist')
    if(order.rating_id) returnErrorResponse('This order has already been rated')
    const vendor = await Vendor.findOne({where:{id:order.vendor_id}})
    const rating = new Rating();
    rating.user_id = userId;
    rating.order_id = orderId;
    rating.vendor_id = vendor.id;
    rating.review = review;
    rating.star = star;
    await rating.save();
    order.rating_id = rating.id;
    await order.save();
    const updateProductRating = async () => {
      const {total_rating, vendor_rating_count} = await this.getVendorRatingStats(vendor.id);
      vendor.total_rating = total_rating.toString();
      vendor.rating_count = vendor_rating_count;
      await vendor.save()
    }
    updateProductRating();
    return successResponse('order rated successfully');
  }


  // async getDriverRatingStats(driver_id: string): Promise<{ total_rating: number, driver_rating_count: number }> {
  //   let total_rating = 0;
  //   const total_driver_rating = await Rating.sum("star", { driver_id });
  //   const driver_rating_count = await Rating.count({ where: { driver_id } });
  //   total_rating = total_driver_rating ? Math.round(total_driver_rating / driver_rating_count) : 0;
  //   return { total_rating, driver_rating_count };
  // }

  async getVendorRatingStats(vendorId: string): Promise<{ total_rating: any, vendor_rating_count: number }> {
    let totalRating = 0;
    const totalVendorRating = await Rating.sum("star", { vendor_id: vendorId });
    const vendorRatingCount = await Rating.count({ where: { vendor_id: vendorId,  } });
    totalRating = totalVendorRating ? totalVendorRating / vendorRatingCount : 0;
    return { total_rating:totalRating, vendor_rating_count:vendorRatingCount };
  }



}
