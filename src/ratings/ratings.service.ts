import { Injectable } from "@nestjs/common";
import { UpdateRatingDto } from "./dto/update-rating.dto";
import { Rating } from "./entities/rating.entity";
import { Trip } from "../trips/entities/trip.entity";
import { TRIP_STATUS } from "../enums/type.enum";
import { IsNull } from "typeorm";
import { Role } from "../enums/role.enum";


@Injectable()
export class RatingsService {
  async createOrUpdate(user_id: string, driver_id: string, trip_id: string, rated_by: Role, star: number, review?: string) {
    const rating = new Rating();
    rating.user_id = user_id;
    rating.driver_id = driver_id;
    rating.review = review;
    rating.star = star;
    rating.trip_id = trip_id;
    rating.rated_by = rated_by;
    await rating.save();
    return true;
  }

  async findAll(data: string, rated_by: Role): Promise<Rating[]> {
    return await Rating.find({
      relations: {
        user: true
      },
      select: {
        user_id: true,
        id:true,
        review: true,
        star: true,
        created_at: true,
        user: {
          full_name: true,
          profile_picture: true
        }
      },
      take: 100,
      where: [{ driver_id: data, rated_by }]
    });
  }

  async getDriverRatingStats(driver_id: string): Promise<{ total_rating: number, driver_rating_count: number, total_trips_count: number }> {
    let total_rating = 0;
    const total_trips_count = await Trip.count({ where: { driver_id, status: TRIP_STATUS.COMPLETED } });
    const total_driver_rating = await Rating.sum("star", { driver_id, rated_by: Role.RIDER });
    const driver_rating_count = await Rating.count({ where: { driver_id, rated_by: Role.RIDER } });
    total_rating = total_driver_rating ? Math.round(total_driver_rating / driver_rating_count) : 0;
    return { total_rating, driver_rating_count, total_trips_count };
  }

  async getRiderRatingStats(rider_id: string): Promise<{ total_rating: number, rider_rating_count: number, total_trips_count: number }> {
    let total_rating = 0;
    const total_trips_count = await Trip.count({
      where: {
        user_id: rider_id,
        // status: TRIP_STATUS.COMPLETED,
        driver_id: IsNull()
      }
    });
    const total_rider_rating = await Rating.sum("star", { user_id: rider_id, rated_by: Role.DRIVER });
    const rider_rating_count = await Rating.count({ where: { user_id: rider_id, rated_by: Role.DRIVER } });
    total_rating = total_rider_rating ? Math.round(total_rider_rating / rider_rating_count) : 0;
    return { total_rating, rider_rating_count, total_trips_count };
  }


  async findOne(data: string) {
    return Rating.findOne({ where: [{ id: data }, { trip_id: data }] });
  }

}
