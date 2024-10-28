import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { HttpException, HttpStatus } from "@nestjs/common";
import { sendMail } from "../../services/nodemailer";
import { returnErrorResponse } from "../../utils/response";
@Processor("driver-queue")
export class DriverProcessor {
}