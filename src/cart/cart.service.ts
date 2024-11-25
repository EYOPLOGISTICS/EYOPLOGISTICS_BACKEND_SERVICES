import {Injectable} from '@nestjs/common';
import {Product} from "../products/entities/product.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {User} from "../users/entities/user.entity";
import {Cart} from "./entities/cart.entity";
import {CartProduct} from "./entities/cart-products.entity";
import {Wishlist} from "./entities/wishlist.entity";

@Injectable()
export class CartService {
    async addToCart(productId: string, user: User) {
        const product = await Product.findOne({where: {id: productId}})
        if (!product) returnErrorResponse('Product does not exist')
        const cart = await this.getCart(user.id)
        if (cart.vendor_id && cart.vendor_id !== product.vendor_id) returnErrorResponse('This product belongs to a different vendor')
        if (await this.productAlreadyInCart(productId, cart.id)) {
            return this.incrementProductInCart(productId, cart.id)
        } else {
            const cartProduct = new CartProduct();
            cartProduct.product_quantity = 1;
            cartProduct.product_id = product.id;
            if (!cart.vendor_id) {
                cart.vendor_id = product.vendor_id;
                await cart.save();
            }
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
        let discount = 0;
        const cart = await Cart.findOne({
            where: {id: cartId}, relations: {cart_products: {product: {vendor: true}}}, select: {
                cart_products: {
                    id: true,
                    product_id: true,
                    product_quantity: true,
                    product_discount: true,
                    cart_id: true,
                    total: true,
                    product: {
                        name: true,
                        image_url: true,
                        quantity: true,
                        selling_price: true,
                        cost_price: true,
                        vendor_id: true,
                        id: true,
                        discount: true,
                        vendor: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        })
        if (!cart) returnErrorResponse('Could not find cart')
        for (const cartProduct of cart.cart_products) {
            const product = cartProduct.product;
            let totalProductAmount = product.selling_price * cartProduct.product_quantity;
            const discountedAmount = product.discount ? (totalProductAmount / 100) * product.discount : totalProductAmount;
            totalProductAmount = product.discount ? totalProductAmount - discountedAmount : totalProductAmount;
            total += totalProductAmount;
            cartProduct.total = totalProductAmount;
            cartProduct.discountedAmount = discountedAmount;
            cartProduct.product_discount = product.discount.toString();
            discount +=   discountedAmount;
            await cartProduct.save();
        }
        cart.total_discount = discount;
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
        let vendorSelect = {};
        vendorSelect = {id:true, location:true}
        let cart = await Cart.findOne({
            relations: {vendor:true, cart_products: {product: {vendor: true}}},
            where: {user_id: userId},
            select: {
                vendor:vendorSelect,
                cart_products: {
                    id: true,
                    product_id: true,
                    product_quantity: true,
                    product_discount: true,
                    cart_id: true,
                    total: true,
                    product: {
                        name: true,
                        image_url: true,
                        quantity: true,
                        selling_price: true,
                        cost_price: true,
                        vendor_id: true,
                        id: true,
                        discount: true,
                        vendor: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        })
        if (!cart) {
            cart = await this.createCart(userId)
        }
        return cart
    }

    async addToWishlist(vendorId:string, user:User, action:string){
        console.log(action)
        let wishlist = await Wishlist.findOne({where:{user_id:user.id, vendor_id:vendorId}})
        if(wishlist && action === 'remove'){
            await wishlist.remove();
        } else if(!wishlist && action === 'add'){
            wishlist = new Wishlist();
            wishlist.vendor_id = vendorId;
            wishlist.user_id = user.id;
            await wishlist.save();
        }
        return successResponse('Done')
    }

    async wishlist(user:User){
        const wishlist = await Wishlist.find({where:{user_id:user.id}, relations:{vendor:true}, select:{vendor:{id:true, name:true, verified:true, logo:true}}})
        return successResponse({wishlist})
    }
}
