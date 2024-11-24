import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import {CartProduct} from "./cart-products.entity";
import {Vendor} from "../../vendors/entities/vendor.entity";

@Entity('wishlists')
export class Wishlist extends EyopBaseEntity{
    @Column({nullable:false})
    vendor_id:string
    @Column({nullable:false})
    user_id:string
    @ManyToOne(() => Vendor, (vendor) => vendor, )
    @JoinColumn({name:'vendor_id'})
    vendor:Vendor
}
