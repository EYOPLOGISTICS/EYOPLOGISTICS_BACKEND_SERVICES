import { Global, Module } from "@nestjs/common";
import { OtpService } from './otp.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Otp } from "./entities/otp.entity";

@Global()
@Module({
  imports:[TypeOrmModule.forFeature([Otp])],
  controllers: [],
  providers: [OtpService],
  exports:[OtpService]
})
export class OtpModule {}
