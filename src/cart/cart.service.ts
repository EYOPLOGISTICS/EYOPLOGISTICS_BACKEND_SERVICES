import {Injectable} from '@nestjs/common';
import {Product} from "../products/entities/product.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {User} from "../users/entities/user.entity";
import {Cart} from "./entities/cart.entity";
import {CartProduct} from "./entities/cart-products.entity";

@Injectable()
export class CartService {
    async addToCart(productId: string, user: User) {
        const product = await Product.findOne({where: {id: productId}})
        if (!product) returnErrorResponse('Product does not exist')
        const cart = await this.getCart(user.id)
        console.log(cart)
        if (await this.productAlreadyInCart(productId, cart.id)) {
            return this.incrementProductInCart(productId, cart.id)
        } else {
            const cartProduct = new CartProduct();
            cartProduct.product_quantity = 1;
            cartProduct.product_id = product.id;
            cartProduct.cart_id = cart.id;
            cartProduct.total = product.selling_price;
            await cartProduct.save();
            return successResponse({cart: await this.sumCart(cart.id)})
        }

    }

    async productAlreadyInCart(productId: string, cartId: string,): Promise<CartProduct | undefined> {
        return await CartProduct.findOne({where: {product_id: productId, cart_id: cartId}})
    }

    async incrementProductInCart(productId: string, cartId: string) {
        const cartProduct = await CartProduct.findOne({
            where: {product_id: productId, cart_id: cartId},
            relations: {product: true},
            select: {product: {selling_price: true}}
        })
        if (!cartProduct) returnErrorResponse('product does not exist in cart')
        cartProduct.product_quantity++
        cartProduct.total = cartProduct.product.selling_price * cartProduct.product_quantity;
        await cartProduct.save();
        return successResponse({cart: await this.sumCart(cartId)})
    }

    async decrementProductInCart(productId: string, user: User) {
        const cart = await this.getCart(user.id)
        if (!cart) returnErrorResponse('Cart does not exist')
        const cartProduct = await CartProduct.findOne({
            where: {product_id: productId, cart_id: cart.id},
            relations: {product: true},
            select: {product: {selling_price: true}}
        })
        if (!cartProduct) returnErrorResponse('product does not exist in cart')
        if (cartProduct.product_quantity === 1) return this.removeProductInCart(productId, cart.id)

        cartProduct.product_quantity--
        cartProduct.total = cartProduct.product.selling_price * cartProduct.product_quantity;
        await cartProduct.save();
        return successResponse({cart: await this.sumCart(cart.id)})
    }

    async removeProductInCart(productId: string, cartId: string) {
        const cartProduct = await CartProduct.findOne({
            where: {product_id: productId, cart_id: cartId},
            relations: {product: true},
            select: {product: {selling_price: true}}
        })
        if (!cartProduct) returnErrorResponse('product does not exist in cart')
        await cartProduct.remove();
        return successResponse({cart: await this.sumCart(cartId)})
    }

    async sumCart(cartId: string): Promise<Cart | any> {
        let total = 0;
        const cart = await Cart.findOne({where: {id: cartId}, relations: {cart_products: {product: true}}})
        if (!cart) returnErrorResponse('Could not find cart')
        for (const cartProduct of cart.cart_products) {
            const product = cartProduct.product;
            let totalProductAmount = product.selling_price * cartProduct.product_quantity;
            const discountedAmount = product.discount ? (totalProductAmount / 100) * product.discount : totalProductAmount;
            totalProductAmount = product.discount ? totalProductAmount - discountedAmount : totalProductAmount;
            total += totalProductAmount;
        }
        cart.total = total;
        await cart.save();
        return cart;

    }


    async createCart(userId: string): Promise<Cart> {
        const cart = new Cart();
        cart.user_id = userId;
        await cart.save();
        return cart
    }

    async getCart(userId: string, loadProducts = false): Promise<Cart> {
        let cart = await Cart.findOne({relations: {cart_products: loadProducts}, where: {user_id: userId}})
        if (!cart) {
            cart = await this.createCart(userId)
        }
        return cart
    }

}
