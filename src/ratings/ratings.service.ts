import { Injectable } from "@nestjs/common";
import { UpdateRatingDto } from "./dto/update-rating.dto";
import { Rating } from "./entities/rating.entity";
import {Product} from "../products/entities/product.entity";
import {successResponse} from "../utils/response";


@Injectable()
export class RatingsService {
  async create(userId: string, productId:string, star: number, review?: string) {
    const rating = new Rating();
    rating.user_id = userId;
    rating.product_id = productId;
    rating.review = review;
    rating.star = star;
    await rating.save();
    const updateProductRating = async () => {
      const product = await Product.findOne({where:{id:productId}})
      const {total_rating, product_rating_count} = await this.getProductRatingStats(productId);
      product.rating = total_rating;
      product.rating_count = product_rating_count;
      await product.save()
    }
    updateProductRating();
    return successResponse('product rated successfully');
  }


  // async getDriverRatingStats(driver_id: string): Promise<{ total_rating: number, driver_rating_count: number }> {
  //   let total_rating = 0;
  //   const total_driver_rating = await Rating.sum("star", { driver_id });
  //   const driver_rating_count = await Rating.count({ where: { driver_id } });
  //   total_rating = total_driver_rating ? Math.round(total_driver_rating / driver_rating_count) : 0;
  //   return { total_rating, driver_rating_count };
  // }

  async getProductRatingStats(productId: string): Promise<{ total_rating: number, product_rating_count: number }> {
    let totalRating = 0;
    const totalProductRating = await Rating.sum("star", { product_id: productId });
    const productRatingCount = await Rating.count({ where: { product_id: productId,  } });
    totalRating = totalProductRating ? Math.round(totalProductRating / productRatingCount) : 0;
    return { total_rating:totalRating, product_rating_count:productRatingCount };
  }



}
