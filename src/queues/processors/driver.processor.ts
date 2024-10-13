import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { HttpException, HttpStatus } from "@nestjs/common";
import { sendMail } from "../../services/nodemailer";
import { returnErrorResponse } from "../../utils/response";
import { DriversService } from "../../drivers/drivers.service";

@Processor("driver-queue")
export class DriverProcessor {
  constructor(private driverService: DriversService) {
  }

  @Process("upload-vehicle")
  async processVehicleInspectionPointUpload(job: Job) {
    try {
      const files = job.data.files;
      const driver = job.data.driver;
      await this.driverService.uploadDriverVehicleInspectionPoints(driver, files);
    } catch (e) {
      console.log(e);
    }
  }
}