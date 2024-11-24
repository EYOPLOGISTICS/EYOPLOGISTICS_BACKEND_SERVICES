import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import {CartService} from './cart.service';
import {AuthUser} from "../decorators/user.decorator";
import {User} from "../users/entities/user.entity";
import {successResponse} from "../utils/response";

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {
    }

    @Get()
    async getCart(@AuthUser() user: User) {
        return successResponse({cart: await this.cartService.getCart(user.id, true)})
    }

    @Post('/:product_id')
    create(@AuthUser() user: User, @Param('product_id') productId: string) {
        return this.cartService.addToCart(productId, user);
    }

    @Post('/wishlist/:vendor_id')
    addToWishlist(@AuthUser() user: User, @Param('vendor_id') vendorId: string, @Query('action') action:string) {
        return this.cartService.addToWishlist(vendorId, user, action);
    }

    @Get('/wishlist')
    wishlist(@AuthUser() user:User){
        return this.cartService.wishlist(user)
    }

    @Patch('/increment/:product_id')
    incrementProduct(@Param('product_id') productId: string, @AuthUser() user: User) {
        return this.cartService.addToCart(productId, user);
    }

    @Patch('/decrement/:product_id')
    decrementProduct(@Param('product_id') productId: string, @AuthUser() user: User) {
        return this.cartService.decrementProductInCart(productId, user);
    }

    @Delete('/remove/:product_id/:cart_id')
    removeProduct(@Param('product_id') productId: string, @Param('cart_id') cartId: string) {
        return this.cartService.removeProductInCart(productId, cartId);
    }

}
