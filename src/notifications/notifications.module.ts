import { Global, Module } from "@nestjs/common";
import { NotificationsService } from './notifications.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationsController } from "./notifications.controller";
@Global()
@Module({
  imports:[TypeOrmModule.forFeature([Notification])],
  controllers:[NotificationsController],
  providers: [NotificationsService],
  exports:[NotificationsService]
})
export class NotificationsModule {}
