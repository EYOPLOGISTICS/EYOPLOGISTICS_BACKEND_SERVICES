import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, OneToMany} from "typeorm";
import {CartProduct} from "./cart-products.entity";

@Entity('carts')
export class Cart extends EyopBaseEntity{
    @Column({nullable:false, default:0})
    total:number

    @Column({nullable:false})
    user_id:string

    @Column({nullable:true})
    vendor_id:string

    @OneToMany(() => CartProduct, (products) => products.cart)
    cart_products:CartProduct[]
}
