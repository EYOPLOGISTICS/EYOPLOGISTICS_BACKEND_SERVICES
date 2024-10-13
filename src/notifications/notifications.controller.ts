import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { AuthUser } from "../decorators/user.decorator";
import { User } from "../users/entities/user.entity";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}


  @Get()
  findAll(@AuthUser() user:User) {
    return this.notificationsService.findAll(user);
  }

}
