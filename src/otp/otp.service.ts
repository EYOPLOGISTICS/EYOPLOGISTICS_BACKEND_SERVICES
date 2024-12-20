import {Injectable} from "@nestjs/common";
import {Otp} from "./entities/otp.entity";
import {QueueService} from "../queues/queue.service";
import {sendSmsWithSendCharm, sendWhatsAppMessage} from "../services/sms";

@Injectable()
export class OtpService {
    constructor(private queueService: QueueService) {
    }

    async sendOtpToMail(email: string) {
        const otpData = await this.generateOtp(email);
        await this.queueService.sendMail({
            to: otpData.email,
            context: {otp: otpData.otp, email: otpData.email},
            template: "/Otp",
            subject: "EYOP STORE OTP"
        });
        return true;
    }

    async sendOtpToMailAndPhoneNumber(email: string, phone_number:string) {
        const otpData = await this.generateOtp(email, phone_number);
        await this.queueService.sendMail({
            to: otpData.email,
            context: {otp: otpData.otp, email: otpData.email},
            template: "/Otp",
            subject: "OSR Cruise OTP"
        });
        const message = `Your ${process.env.APP_NAME} authentication code is ${otpData.otp}. Do not share this with anyone`;
         sendSmsWithSendCharm(phone_number, message)
         sendWhatsAppMessage(phone_number, message)
        return true;
    }

    async sendOtpToPhoneNumber(phone_number: string) {
        const otp = await this.generateOtp(null, phone_number);
        await sendSmsWithSendCharm(phone_number, `Your ${process.env.APP_NAME} passcode to login is ${otp.otp}. Do not share this OTP with anyone`)
        return true;
    }

    async findOne(field: any, otp?: number) {
        return await Otp.findOne({
            where: [
                {email: field, otp},
                {phone_number: field, otp}
            ]
        });
    }

    async generateOtp(email?: string, phone_number?: string) {
        const numb = this.generateRandomNum();
        let otp = await Otp.findOne({where: [{email}, {phone_number}]})
        if (!otp) otp = new Otp();
        otp.otp = numb;
        otp.email = email;
        otp.phone_number = phone_number;
        otp.verified = false;
        await otp.save();
        return otp;
    }

    generateRandomNum() {
        const min = 1000;
        const max = 9999;
        return Math.floor(Math
            .random() * (max - min + 1)) + min;
    }

    findAll() {
        return `This action returns all otp`;
    }

    async verifyOtp(field: string, otp: number): Promise<boolean> {
        const otpData = await this.findOne(field, otp);
        if (!otpData || otpData.verified) return false;
        await otpData.remove();
        return true;
    }

    async remove(email: string) {
        const otp = await Otp.findOneBy({email});
        if (otp) await otp.remove();
        return true;
    }
}
