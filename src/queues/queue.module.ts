import { forwardRef, Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { EmailProcessor } from "./processors/email.processor";
import { QueueService } from "./queue.service";
import { TripProcessor } from "./processors/trip.processor";
import { DriversModule } from "../drivers/drivers.module";
import { DriversService } from "../drivers/drivers.service";

@Global()
@Module({
  imports: [
    DriversModule,
    BullModule.registerQueue({ name: "driver-queue" }, {
      name: "email-queue"
    }, { name: "trip-queue" })
  ],
  providers: [DriversService, QueueService, EmailProcessor, TripProcessor],
  exports: [BullModule, QueueService]
})
export class QueueModule {
}