import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToOne} from "typeorm";

@Entity('timelines')
export class Timeline extends EyopBaseEntity{
    @Column({nullable:true})
    title:string

    @Column({nullable:true})
    description:string

    @Column({nullable:false})
    order:number

}
