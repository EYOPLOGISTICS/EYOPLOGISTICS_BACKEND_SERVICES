import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToOne} from "typeorm";
import {Product} from "../../products/entities/product.entity";
import {Order} from "./order.entity";
import {Timeline} from "./timeline.entity";

@Entity('order_timelines')
export class OrderTimeline extends EyopBaseEntity{
    @Column({nullable:true})
    order_id:string

    @Column({nullable:true})
    timeline_id:string

    @Column({nullable:false, default:true})
    status:boolean

    @ManyToOne(() => Order, (order) => order, {onDelete:'CASCADE'})
    @JoinColumn({name:'order_id'})
    order:Order

    @ManyToOne(() => Timeline, (timeline) => timeline, {eager:true})
    @JoinColumn({name:'timeline_id'})
    timeline:Timeline

}
