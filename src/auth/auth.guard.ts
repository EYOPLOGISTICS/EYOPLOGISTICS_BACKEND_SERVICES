import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {Request} from "express";
import {jwtConstant} from "../utils";
import {Reflector} from "@nestjs/core";
import {IS_PUBLIC_KEY} from "../decorators/public-endpoint.decorator";
import {UsersService} from "../users/users.service";
import {DOMAIN_TYPE} from "../enums/type.enum";
import {AuthService} from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private jwtService: JwtService, private userService: UsersService, private reflector: Reflector) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        const request = context.switchToHttp().getRequest();
        console.log(request.path)
        console.log(`osr-version ${request.headers['osr-version']}`)
        if (!this.isValidDomain(request) && !request.path.includes("webhook")) throw new UnauthorizedException();
        // if(!this.isCurrentVersion(request) && !request.path.includes("webhook")) returnErrorResponse('We\'ve just released a new update for the app which includes some great new features! To make sure you\'re getting the most out of the app, we recommend you update the app.')
        if (isPublic) {
            return true;
        }
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstant.secret
                }
            );
            request["sub"] = payload.sub;
            if (!this.authService.isDomainMatchingUserRole(payload.username, request["DM"])) new Error();
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }


    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }

    private isCurrentVersion(request: Request): boolean {
        const version = request.headers['osr-version'] ? parseInt(<string>request.headers['osr-version']) : null;
        return version === parseInt(process.env.OSR_VERSION)
    }

    private isValidDomain(request: Request): boolean {
        const header = request.headers["dm"];
        const domains = [DOMAIN_TYPE.RIDER, DOMAIN_TYPE.DRIVER, DOMAIN_TYPE.ADMIN];
        if (!header || !domains.includes(<DOMAIN_TYPE>header)) return false;
        request["DM"] = header;
        return true;
    }

}
