import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { jwtConstant } from "../utils/";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstant.secret,
      signOptions: { expiresIn:"9999 years" }
    })
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: AuthGuard
  }, AuthService],
  // providers: [ AuthService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {
}