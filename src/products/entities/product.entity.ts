import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {Image} from "./images.entity";
import {Vendor} from "../../vendors/entities/vendor.entity";
import {Rating} from "../../ratings/entities/rating.entity";

@Entity('products')
export class Product extends EyopBaseEntity {
    @Column({nullable:false})
    name: string

    @Column({nullable:false})
    category_name: string

    @Column({nullable:false})
    sub_category_name: string

    @Column({nullable:false})
    slug: string

    @Column({nullable:false, type:'text'})
    description: string

    @Column({nullable:true})
    image_url: string

    @Column()
    image_count: number

    @Column()
    selling_price: number

    @Column()
    cost_price: number

    @Column({nullable: false, default: 0})
    vat: number

    @Column({nullable: false, default: 0})
    discount: number

    @Column({nullable: false})
    category_id: string

    @Column({nullable: false})
    vendor_id: string

    @Column({nullable: false})
    sub_category_id: string

    @Column({nullable: false, default: 0})
    quantity: number

    @Column({nullable: false, default: 0})
    rating: number

    @Column({nullable: false, default: 0})
    rating_count: number

    @OneToMany(() => Image, (image) => image.product)
    images: Image[]


    @ManyToOne(() => Vendor, (vendor) => vendor, {
        onDelete:'CASCADE'
    })
    @JoinColumn({name:'vendor_id'})
    vendor:Vendor

}
