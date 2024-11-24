import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {MapDto} from "../dto/create-vendor.dto";
import {SUPPORTED_COUNTRIES} from "../../utils";
import {User} from "../../users/entities/user.entity";

@Entity('vendors')
export class Vendor extends EyopBaseEntity {
    @Column({nullable: false})
    name: string

    @Column({nullable: false})
    vendor_category_id: string

    @Column({nullable: false, type:'text'})
    description: string

    @Column({nullable: false})
    email: string

    @Column({nullable: false, default:0})
    balance: number

    @Column({nullable: false, default:0})
    rating_count: number

    @Column({nullable: false, default:0, type:'float'})
    total_rating: string

    @Column({nullable: false})
    phone_number: string

    @Column({nullable: false})
    logo: string

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
    location: MapDto;

    @Column({nullable: true})
    city: string

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.name})
    country: string

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.code})
    currency: string

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.symbol})
    currency_symbol: string

    @Column({nullable: true})
    address: string

    @Column({nullable: true})
    cac: string

    @Column({nullable: false, default:false})
    verified: boolean

    @Column({nullable: false, default:false})
    has_bank_account: boolean

    @Column({name:'owner_id'})
    owner_id:string

    @ManyToOne(() => User, (owner) =>owner, {
        onDelete:'CASCADE',
    })
    @JoinColumn({name:'owner_id'})
    owner:User

    @Column({default:true})
    is_active:boolean
}