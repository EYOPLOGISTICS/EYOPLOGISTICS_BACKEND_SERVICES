import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { returnErrorResponse } from "../utils/response";
import { Driver } from "../drivers/entities/driver.entity";
import { Reflector } from "@nestjs/core";
import { bY_PASS_DRIVER_GUARD } from "../decorators/driver-public.decorator";
import { DriversService } from "../drivers/drivers.service";

@Injectable()
export class DriverGuard implements CanActivate {
  constructor(private driversService: DriversService, private userService: UsersService, private reflector: Reflector) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(bY_PASS_DRIVER_GUARD, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;
    const driver_id = request.headers["d-id"];
    if (!driver_id) returnErrorResponse("Invalid driver header parameters, please include the driver id in the headers as d-id whenever a drivers endpoint is called");
    const user = await this.userService.findOne(request.sub, ['id']);
    const driver = await this.driversService.findOne(driver_id, ['user_id', 'id', 'is_active'])
    if (!driver) returnErrorResponse("Driver does not exist");
    if(!driver.is_active) returnErrorResponse('Your account has been deactivated');
    if (driver.user_id !== user.id) returnErrorResponse("Unauthorized");
    return true;
  }

}