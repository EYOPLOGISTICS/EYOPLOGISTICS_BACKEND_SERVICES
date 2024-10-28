import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";

@Entity('vendor_categories')
export class VendorCategory extends EyopBaseEntity {
    @Column({nullable: false})
    name: string

    @Column({nullable: true})
    image: string

    @Column({nullable: false})
    slug: string

    @Column({nullable: true, type:'text'})
    description: string

}
