import {
    Body,
    Controller,
    Delete,
    Get, HttpStatus,
    Param,
    Patch,
    Post,
    Render,
    Req,
    Res,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {UsersService} from "./users.service";
import {UpdatePaymentType, UpdateUserDto, UpdateUserLocation} from "./dto/update-user.dto";
import {successResponse} from "../utils/response";
import {FileInterceptor} from "@nestjs/platform-express";
import {ApiConsumes, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ErrorResponseType, SuccessResponseType} from "../enums/type.enum";
import {AuthUser} from "../decorators/user.decorator";
import {User} from "./entities/user.entity";
import {ChangePassword} from "./dto/create-user.dto";

@ApiTags("User")
@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }


    @Get('/cards')
    getUserCards(@AuthUser() user: User) {
        return this.usersService.getUserCards(user);
    }


    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.usersService.findOne(id);
    }

    @Patch()
    @UseInterceptors(FileInterceptor("profile_picture"))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({summary: "Update a user record"})
    @ApiResponse({
        description: "returns the updated user record and a success message",
        status: HttpStatus.OK,
        type: SuccessResponseType
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        type: ErrorResponseType,
        description: "Invalid request or validation error"
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        type: ErrorResponseType,
        description: "User not found"
    })
    async update(@AuthUser() user: User, @UploadedFile() profile_picture: Express.Multer.File, @Body() updateUserDto: UpdateUserDto): Promise<SuccessResponseType | ErrorResponseType> {
        return successResponse({
            user: await this.usersService.updateUser(user, updateUserDto, profile_picture),
            message: "user updated successfully"
        });
    }

    @Patch('/update-location')
    async updateLocation(@AuthUser() user: User, @Body() updateUserLocation: UpdateUserLocation) {
       user.location = updateUserLocation.location;
       user.address = updateUserLocation.address;
        await user.save();
        return successResponse('location updated successfully')
    }


    @Patch('/payment-method')
    async updatePaymentMethod(@AuthUser() user: User, @Body() updatePaymentTypeDto: UpdatePaymentType) {
        user.payment_method = updatePaymentTypeDto.payment_method;
        await user.save();
        return successResponse('payment type updated successfully')
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.usersService.remove(id);
    }

    @Patch("/change-password")
    changePassword(@AuthUser() user: User, @Body() changePasswordDto: ChangePassword) {
        return this.usersService.changePassword(changePasswordDto, user);
    }
}
