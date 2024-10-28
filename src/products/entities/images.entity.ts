import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {Product} from "./product.entity";

@Entity('images')
export class Image extends EyopBaseEntity {
    @Column({nullable: false})
    product_id: string

    @Column({nullable: false})
    url: string

    @ManyToOne(() => Product, (product) => product.images, {
        onDelete:'CASCADE'
    })
    @JoinColumn({name: 'product_id'})
    product: Product
}
