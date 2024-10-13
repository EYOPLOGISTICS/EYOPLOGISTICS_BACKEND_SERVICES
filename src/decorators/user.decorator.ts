import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../users/entities/user.entity";
import { returnErrorResponse } from "../utils/response";

export const AuthUser = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = await User.findOne({ where: { id: request.sub } });
    if (!user) returnErrorResponse("Invalid user");
    return user;
  }
);