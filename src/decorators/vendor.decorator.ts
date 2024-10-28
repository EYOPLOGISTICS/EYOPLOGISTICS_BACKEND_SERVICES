import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import {User} from "../users/entities/user.entity";
import {returnErrorResponse} from "../utils/response";
import {Vendor} from "../vendors/entities/vendor.entity";

export const GetVendor = createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const vendorId = request.headers['v-id']
        if (vendorId) returnErrorResponse('Vendor is required')
        const vendor = await Vendor.findOne({where: {id: vendorId}});
        if (!vendor) returnErrorResponse("Invalid vendor");
        return vendor;
    }
);

export const GetVendorId = createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const vendorId = request.headers['v-id']
        if (!vendorId) returnErrorResponse('Vendor is required')
        return vendorId;
    }
);