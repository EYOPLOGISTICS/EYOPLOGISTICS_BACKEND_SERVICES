import { PartialType } from '@nestjs/swagger';
import {RateProductDto} from "./create-rating.dto";

export class UpdateRatingDto extends PartialType(RateProductDto) {}
