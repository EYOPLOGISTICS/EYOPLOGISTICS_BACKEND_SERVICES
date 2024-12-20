import {AfterLoad, Column, Entity, Index, OneToMany, OneToOne} from "typeorm";
import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Role} from "../../enums/role.enum";
import {CURRENCIES, formatDateTime, isNull, SUPPORTED_COUNTRIES} from "../../utils";
import {PAYMENT_TYPE} from "../../enums/type.enum";
import {Exclude} from "class-transformer";
import {MapDto} from "../../vendors/dto/create-vendor.dto";

@Entity("users")
export class User extends EyopBaseEntity {
    @Column({nullable: true})
    first_name: string;

    @Column({nullable: true})
    last_name: string;

    @Column({nullable: true, default:0})
    rating: number;

    @Column({nullable: true})
    full_name: string;

    @Column({nullable: true, unique: true})
    phone_number: string;

    @Column({nullable: false, select:false})
    password: string;

    @Column({nullable: true})
    gender: string;

    @Column({nullable: true, default:'CHJ4+2J2'})
    address: string;

    @Column({nullable: true})
    customer_id: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.name})
    country: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.code})
    currency: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.symbol})
    currency_symbol: string;

    @Column({nullable: true, default:'Lagos'})
    city: string

    @Column({nullable:true})
    payment_method:PAYMENT_TYPE

    @Column({nullable: true})
    profile_picture: string;

    @Column({nullable: false, default: 0})
    wallet_balance: number;

    @Column({unique: true, nullable: true})
    email: string;

    @Column({nullable: false, default: true})
    is_active: boolean;

    @Column({nullable: false, default: Role.USER})
    role: Role;

    @Column({nullable: false, default: false})
    verified: boolean;

    @Column({
        default:'"{\\"lat\\":\\"6.4302155\\",\\"lng\\":\\"3.5564407\\"}"',
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


    // @AfterLoad()
    // callAfterLoad() {
    //     if (!isNull(this.address)){
    //         this.country = this.address
    //     }
    //     if (!isNull(this.created_at)){
    //         this.created_at = formatDateTime(this.created_at);
    //     }
    // }


}
