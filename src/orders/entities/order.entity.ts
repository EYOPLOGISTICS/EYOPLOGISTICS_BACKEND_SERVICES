import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {ORDER_STATUS, ORDER_TIMELINE, PAYMENT_METHOD, PAYMENT_STATUS, SHIPPING_METHOD} from "../../enums/type.enum";
import {MapDto} from "../../vendors/dto/create-vendor.dto";
import {OrderProduct} from "./order-products.entity";
import {OrderTimeline} from "./order_timeline.entity";
import {Vendor} from "../../vendors/entities/vendor.entity";
import {Rating} from "../../ratings/entities/rating.entity";
import {User} from "../../users/entities/user.entity";
@Entity('orders')
export class Order extends EyopBaseEntity{
    @Column({nullable:false})
    user_id:string

    @Column({nullable:true})
    tracking_id:string

    @Column({nullable:false})
    cart_id:string

    @Column({nullable:false})
    vendor_id:string

    @Column({nullable:true})
    card_id:string

    @Column({nullable:false})
    payment_method:PAYMENT_METHOD

    @Column({nullable:false, default:PAYMENT_STATUS.PENDING})
    payment_status:PAYMENT_STATUS

    @Column({nullable:false, default:ORDER_TIMELINE.PROCESSING})
    timeline_status:ORDER_TIMELINE

    @Column({nullable:false, default:ORDER_STATUS.PENDING})
    status:ORDER_STATUS

    @Column({nullable:false})
    shipping_address:string

    @Column({
        nullable: true, type: "json", transformer: {
            to(value) {
                return JSON.stringify(value);
            },
            from(value) {
                // Do nothing
                return JSON.parse(JSON.stringify(value));
            }
        }
    })
    shipping_location: MapDto;

    @Column({nullable:false})
    shipping_method:SHIPPING_METHOD

    @Column({nullable:false})
    cart_total:number

    @Column({nullable:true})
    km:number

    @Column({nullable:true})
    discount:number

    @Column({nullable:true})
    total_profit:number

    @Column({nullable:true})
    total_product_sold:number

    @Column({nullable:true})
    duration:string

    @Column({nullable:false})
    order_total:number

    @Column({nullable:false, default:0})
    delivery_fee:number
    @Column({nullable:false, default:0})
    service_fee:number

    @Column({default:false})
    is_active:boolean

    @Column({nullable:true})
    rating_id:string

    @ManyToOne(() => Vendor, (vendor) => vendor)
    @JoinColumn({name:'vendor_id'})
    vendor:Vendor

    @ManyToOne(() => User, (user) => user)
    @JoinColumn({name:'user_id'})
    user:User

    @OneToMany(() => OrderProduct, (orderProducts) => orderProducts.order)
    products:OrderProduct[]

    @OneToMany(() => OrderTimeline, (orderTimelines) => orderTimelines.order)
    timelines:OrderTimeline[]
    @ManyToOne(() => Rating, (rating) => rating)
    @JoinColumn({name:'rating_id'})
    rating:Rating

}
