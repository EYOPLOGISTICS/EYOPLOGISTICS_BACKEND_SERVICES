import { forwardRef, Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { EmailProcessor } from "./processors/email.processor";
import { QueueService } from "./queue.service";
import { TripProcessor } from "./processors/trip.processor";
@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: "driver-queue" }, {
      name: "email-queue"
    }, { name: "trip-queue" })
  ],
  providers: [QueueService, EmailProcessor, TripProcessor],
  exports: [BullModule, QueueService]
})
export class QueueModule {
}