import { Global, Module } from "@nestjs/common";
import { RatingsService } from './ratings.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rating } from "./entities/rating.entity";
@Global()
@Module({
  imports:[TypeOrmModule.forFeature([Rating])],
  providers: [RatingsService],
  exports:[RatingsService]
})
export class RatingsModule {}
