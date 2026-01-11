import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import {Cart} from "./cart.entity";
import {Product} from "../../products/entities/product.entity";

@Entity('cart_products')
@Index(['cart_id', 'product_id'], { unique: true })
export class CartProduct extends EyopBaseEntity {

    @Column()
    product_id: string;

    @Column({ default: 1 })
    product_quantity: number;

    @Column({nullable:true})
    product_discount: string;

    @Column()
    cart_id: string;

    @Column({ type: 'float', default: 0 })
    total: number;

    @Column({ type: 'float', default: 0 })
    discountedAmount: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Cart, (cart) => cart.cart_products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;
}
