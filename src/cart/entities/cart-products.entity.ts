import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToOne} from "typeorm";
import {Cart} from "./cart.entity";
import {Product} from "../../products/entities/product.entity";

@Entity('cart_products')
export class CartProduct extends EyopBaseEntity{

    @Column({nullable:false})
    product_id:string

    @Column({nullable:false})
    product_quantity:number

    @Column({nullable:false, default:0})
    product_discount:string

    // @Column({nullable:false})
    // price:string

    @Column({nullable:false, name:'cart_id'})
    cart_id:string

    @Column({nullable:false, default:0})
    total:number

    @Column({nullable:false, default:0})
    discountedAmount:number

    @OneToOne(() => Product, (product) => product)
    @JoinColumn({name:'product_id',})
    product:Product

    @ManyToOne(() => Cart, (cart) => cart.cart_products, {onDelete:'CASCADE'})
    @JoinColumn({name:'cart_id'})
    cart:Cart
}
