import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { SendEmailType } from "../enums/type.enum";

@Injectable()
export class QueueService {
  constructor(@InjectQueue("email-queue") private emailQueue: Queue, @InjectQueue("trip-queue") private tripQueue: Queue, @InjectQueue("driver-queue") private driverQueue: Queue) {
  }

  async sendMail(data: SendEmailType) {
    await this.emailQueue.add("send-mail", {
      data: data
    });
  }

  async testQueue() {
    await this.tripQueue.add("test-queue", {
      data: "test"
    });
  }


}
