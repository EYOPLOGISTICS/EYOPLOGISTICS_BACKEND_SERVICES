import { Global, Module } from "@nestjs/common";
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { DriversModule } from "../drivers/drivers.module";
import { DriversService } from "../drivers/drivers.service";
import {Device} from "./entities/device.entity";

@Global()
@Module({
  imports:[DriversModule, TypeOrmModule.forFeature([User, Device])],
  controllers: [UsersController],
  providers: [UsersService, DriversService],
  exports:[UsersService]
})
export class UsersModule {}
