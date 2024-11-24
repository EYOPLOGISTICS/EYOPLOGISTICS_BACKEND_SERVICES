import { PartialType } from '@nestjs/swagger';
import { RateVendorDto} from "./create-rating.dto";

export class UpdateRatingDto extends PartialType(RateVendorDto) {}
