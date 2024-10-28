import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToOne} from "typeorm";
import {Product} from "../../products/entities/product.entity";
import {Order} from "./order.entity";

@Entity('order_products')
export class OrderProduct extends EyopBaseEntity{
    @Column({nullable:true})
    product_name:string

    @Column({nullable:false})
    product_id:string

    @Column({nullable:false, name:'order_id'})
    order_id:string

    @Column({nullable:false})
    product_quantity:number

    @Column({nullable:false, default:0})
    product_discount:number

    @Column({nullable:false})
    product_selling_price:number

    @Column({nullable:false})
    product_cost_price:number

    @Column({nullable:false})
    total:number

    @OneToOne(() => Order, (order) => order, {onDelete:'CASCADE'})
    @JoinColumn({name:'order_id',})
    order:Order

}
