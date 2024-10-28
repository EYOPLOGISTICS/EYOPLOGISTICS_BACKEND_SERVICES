import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, OneToMany} from "typeorm";
import {SubCategory} from "./subcategory.entity";

@Entity('categories')
export class Category extends EyopBaseEntity{
    @Column({nullable:false})
    name:string

    @Column({nullable:false})
    slug:string

    @Column({nullable:true})
    description:string

    @Column({nullable:true})
    image:string

    @Column({nullable:false, default:true})
    active:boolean

    @OneToMany(() => SubCategory, (sub_categories) => sub_categories.category)
    sub_categories:SubCategory[]
}
