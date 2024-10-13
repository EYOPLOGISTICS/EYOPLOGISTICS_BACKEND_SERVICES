import {ClassSerializerInterceptor, Module, OnApplicationBootstrap} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import {AppController} from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BullModule } from "@nestjs/bull";
import { QueueModule } from "./queues/queue.module";
import { ScheduleModule } from "@nestjs/schedule";
import { OtpModule } from "./otp/otp.module";
import { TripsModule } from './trips/trips.module';
import { DriversModule } from './drivers/drivers.module';
import { OffersModule } from "./offers/offers.module";
import { TransactionsModule } from './transactions/transactions.module';
import { AppService } from "./app.service";
import { ImagesModule } from "./images/images.module";
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TripsService } from "./trips/trips.service";
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { DriversService } from "./drivers/drivers.service";
import { RideSharingModule } from './ride_sharing/ride_sharing.module';
import { ChatsModule } from './chats/chats.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SchedulerService } from "./scheduler/scheduler.service";
import { AdminModule } from './admin/admin.module';
import {AdminService} from "./admin/services/admin.service";
import {APP_INTERCEPTOR} from "@nestjs/core";
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: Number(configService.get('REDIS_PORT')),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity{ .ts,.js}'],
      synchronize: true,
    }),

    RatingsModule,
    ImagesModule,
    OtpModule,
    QueueModule,
    TripsModule,
    OffersModule,
    DriversModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    NotificationsModule,
    PromoCodesModule,
    RideSharingModule,
    ChatsModule,
    SchedulerModule,
    AdminModule,
  ],
  controllers:[AppController],
  providers: [AppService, TripsService, DriversService, AdminService,{
    provide: APP_INTERCEPTOR,
    useClass: ClassSerializerInterceptor,
  }],
})
export class AppModule{
}
