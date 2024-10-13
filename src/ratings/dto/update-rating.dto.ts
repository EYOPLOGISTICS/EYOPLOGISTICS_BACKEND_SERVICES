import { PartialType } from '@nestjs/swagger';
import {  RateTripDto } from "./create-rating.dto";

export class UpdateRatingDto extends PartialType(RateTripDto) {}
