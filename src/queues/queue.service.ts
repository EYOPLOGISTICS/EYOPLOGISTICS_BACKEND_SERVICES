import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { SendEmailType } from "../enums/type.enum";
import { Trip } from "../trips/entities/trip.entity";
import { Driver } from "../drivers/entities/driver.entity";

@Injectable()
export class QueueService {
  constructor(@InjectQueue("email-queue") private emailQueue: Queue, @InjectQueue("trip-queue") private tripQueue: Queue, @InjectQueue("driver-queue") private driverQueue: Queue) {
  }

  async sendMail(data: SendEmailType) {
    await this.emailQueue.add("send-mail", {
      data: data
    });
  }

  async dispatchTripToNearbyAvailableDrivers(trip: Trip) {
    await this.tripQueue.add("dispatch-trip-to-nearby-available-drivers", {
      data: trip
    });
  }

  async testQueue() {
    await this.tripQueue.add("test-queue", {
      data: "test"
    });
  }


  async uploadVehicleInspectionPointQueue(driver: Driver, files) {
    console.log("inside queue");
    await this.tripQueue.add("upload-vehicle-inspection-points", {
      driver,
      files
    });
  }

}
