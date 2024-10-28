import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {Category} from "./category.entity";

@Entity('sub_categories')
export class SubCategory extends EyopBaseEntity {
    @Column({nullable: false})
    name: string

    @Column({nullable: false})
    slug: string

    @Column({nullable: true})
    description: string

    @Column({nullable: true})
    image: string

    @Column({name: 'category_id'})
    category_id: string

    @ManyToOne(() => Category, (category) => category.sub_categories, {
        onDelete:'CASCADE'
    })
    @JoinColumn({name: 'category_id'})
    category: Category

}
