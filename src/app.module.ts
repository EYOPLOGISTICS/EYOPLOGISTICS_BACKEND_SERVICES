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
import { TransactionsModule } from './transactions/transactions.module';
import { AppService } from "./app.service";
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SchedulerService } from "./scheduler/scheduler.service";

import {APP_INTERCEPTOR} from "@nestjs/core";
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';
import { BankAccountsModule } from './bank_accounts/bank_accounts.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
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
    OtpModule,
    QueueModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    NotificationsModule,
    SchedulerModule,
    VendorsModule,
    ProductsModule,
    BankAccountsModule,
    CartModule,
    OrdersModule,
  ],
  controllers:[AppController],
  providers: [AppService,{
    provide: APP_INTERCEPTOR,
    useClass: ClassSerializerInterceptor,
  }],
})
export class AppModule{
}
