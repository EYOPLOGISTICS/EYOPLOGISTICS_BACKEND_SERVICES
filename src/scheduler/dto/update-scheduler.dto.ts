import { PartialType } from '@nestjs/swagger';
import { CreateSchedulerDto } from './create-scheduler.dto';

export class UpdateSchedulerDto extends PartialType(CreateSchedulerDto) {}
