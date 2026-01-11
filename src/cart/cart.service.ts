import {Injectable} from '@nestjs/common';
import {Product} from "../products/entities/product.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {User} from "../users/entities/user.entity";
import {Cart} from "./entities/cart.entity";
import {CartProduct} from "./entities/cart-products.entity";
import {Wishlist} from "./entities/wishlist.entity";
import * as console from 'node:console';

@Injectable()
export class CartService {
    async addToCart(productId: string, user: User) {
        const product = await Product.findOne({ where: { id: productId } });
        if (!product) returnErrorResponse('Product does not exist');

        const cart = await this.getCartMeta(user.id);

        if (cart.vendor_id && cart.vendor_id !== product.vendor_id)
            returnErrorResponse('This product belongs to a different vendor');

        const discount = product.discount ?? 0;

        console.log("discount", discount)

        const existing = await CartProduct.findOne({
            where: { cart_id: cart.id, product_id: productId }
        });

        if (existing) {
            const newQty = existing.product_quantity + 1;
            const discountedAmount = this.calcDiscountAmount(product.selling_price, newQty, discount);
            const net = this.calcNetTotal(product.selling_price, newQty, discount);

            await CartProduct.update(existing.id, {
                product_quantity: newQty,
                product_discount: discount.toString(),
                discountedAmount,
                total: net
            });

        } else {
            const discountedAmount = this.calcDiscountAmount(product.selling_price, 1, discount);
            const net = this.calcNetTotal(product.selling_price, 1, discount);

            await CartProduct.create({
                cart_id: cart.id,
                product_id: product.id,
                product_quantity: 1,
                product_discount: discount.toString(),
                discountedAmount,
                total: net
            }).save();

            if (!cart.vendor_id) {
                cart.vendor_id = product.vendor_id;
                await cart.save()
            }
        }

        await this.recalculateCartTotals(cart.id);

        return successResponse({ cart: await this.getCartFull(cart.id) });
    }


    async incrementProductInCart(productId: string, user: User) {
        const cart = await this.getCartMeta(user.id);

        const cartProduct = await CartProduct.findOne({
            where: { cart_id: cart.id, product_id: productId },
            relations: { product: true }
        });
        if (!cartProduct) returnErrorResponse('Product not in cart');

        const discount = cartProduct.product.discount ?? 0;
        const newQty = cartProduct.product_quantity + 1;

        const discountedAmount = this.calcDiscountAmount(cartProduct.product.selling_price, newQty, discount);
        const net = this.calcNetTotal(cartProduct.product.selling_price, newQty, discount);

        await CartProduct.update(cartProduct.id, {
            product_quantity: newQty,
            product_discount: discount.toString(),
            discountedAmount,
            total: net
        });

        await this.recalculateCartTotals(cart.id);

        return successResponse({ cart: await this.getCartFull(cart.id) });
    }



    async decrementProductInCart(productId: string, user: User) {
        const cart = await this.getCartMeta(user.id);

        const cartProduct = await CartProduct.findOne({
            where: { cart_id: cart.id, product_id: productId },
            relations: { product: true }
        });
        if (!cartProduct) returnErrorResponse('Product not in cart');

        if (cartProduct.product_quantity === 1) {
            return this.removeProductInCart(productId, user);
        }

        const discount = cartProduct.product.discount ?? 0;
        const newQty = cartProduct.product_quantity - 1;

        const discountedAmount = this.calcDiscountAmount(cartProduct.product.selling_price, newQty, discount);
        const net = this.calcNetTotal(cartProduct.product.selling_price, newQty, discount);

        await CartProduct.update(cartProduct.id, {
            product_quantity: newQty,
            product_discount: discount.toString(),
            discountedAmount,
            total: net
        });

        await this.recalculateCartTotals(cart.id);

        return successResponse({ cart: await this.getCartFull(cart.id) });
    }


    async removeProductInCart(productId: string, user: User) {
        const cart = await this.getCartMeta(user.id);

        await CartProduct.delete({ cart_id: cart.id, product_id: productId });

        const count = await CartProduct.count({ where: { cart_id: cart.id } });
        if (!count) await Cart.update(cart.id, { vendor_id: null });

        await this.recalculateCartTotals(cart.id);

        return successResponse({ cart: await this.getCartFull(cart.id) });
    }



    async getCartFull(cartId: string) {
        await this.revalidateCart(cartId);

        return await Cart.findOne({
            where: { id: cartId },
            relations: { cart_products: { product: { vendor: true } }, vendor: true }
        });
    }



    async getCartMeta(userId: string): Promise<Cart> {
        let cart = await Cart.findOne({
            where: { user_id: userId },
            select: { id: true, vendor_id: true, total: true, total_discount: true }
        });

        if (!cart) {
            cart = Cart.create({
                user_id: userId,
                total: 0,
                total_discount: 0
            });
            await cart.save();
        }

        return cart;
    }



    async addToWishlist(vendorId: string, user: User, action: string) {
        let wishlist = await Wishlist.findOne({where: {user_id: user.id, vendor_id: vendorId}})
        if (wishlist && action === 'remove') {
            await wishlist.remove();
        } else if (!wishlist && action === 'add') {
            wishlist = new Wishlist();
            wishlist.vendor_id = vendorId;
            wishlist.user_id = user.id;
            await wishlist.save();
        }
        return successResponse('Done')
    }

    async wishlist(user: User) {
        const wishlist = await Wishlist.find({
            where: {user_id: user.id},
            relations: {vendor: true},
            select: {vendor: {id: true, name: true, verified: true, logo: true}}
        })
        return successResponse({wishlist})
    }

    async revalidateCart(cartId: string) {
        const cart = await Cart.findOne({
            where: { id: cartId },
            relations: { cart_products: { product: true } }
        });

        if (!cart) return;

        let cartChanged = false;
        let total = 0;
        let totalDiscount = 0;

        for (const item of cart.cart_products) {
            const product = item.product;

            // 🧹 1. Remove out-of-stock or deleted products
            if (!product || product.quantity <= 0) {
                await item.remove();
                cartChanged = true;
                continue;
            }

            // 2. Clamp quantity to available stock
            if (item.product_quantity > product.quantity) {
                item.product_quantity = product.quantity;
                cartChanged = true;
            }

            const discount = product.discount ?? 0;
            const gross = product.selling_price * item.product_quantity;
            const discountAmount = discount > 0 ? (gross * discount) / 100 : 0;
            const net = gross - discountAmount;

            // 3. Sync cart snapshot with product truth
            if (
              item.product_discount !== discount.toString() ||
              item.discountedAmount !== discountAmount ||
              item.total !== net
            ) {
                item.product_discount = discount.toString();
                item.discountedAmount = discountAmount;
                item.total = net;
                await item.save();
                cartChanged = true;
            }

            total += net;
            totalDiscount += discountAmount;
        }

        // 4. Fix vendor if cart becomes empty
        if (!cart.cart_products.length) {
            cart.vendor_id = null;
        }

        cart.total = total;
        cart.total_discount = totalDiscount;

        if (cartChanged) {
            await cart.save();
        }
    }


    private calcDiscountAmount(price: number, qty: number, discount: number) {
        if (!discount || discount <= 0) return 0;
        return (price * qty * discount) / 100;
    }

    private calcNetTotal(price: number, qty: number, discount: number) {
        return (price * qty) - this.calcDiscountAmount(price, qty, discount);
    }

    async recalculateCartTotals(cartId: string) {
        const { total, discount } = await CartProduct.createQueryBuilder("cp")
          .select("SUM(cp.total)", "total")
          .addSelect("SUM(cp.discountedAmount)", "discount")
          .where("cp.cart_id = :cartId", { cartId })
          .getRawOne();

        await Cart.update(cartId, {
            total: Number(total) || 0,
            total_discount: Number(discount) || 0
        });
    }





}
