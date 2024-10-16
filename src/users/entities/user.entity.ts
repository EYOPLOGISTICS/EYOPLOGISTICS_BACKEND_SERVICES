import {AfterLoad, Column, Entity, Index, OneToMany, OneToOne} from "typeorm";
import {OsrBaseEntity} from "../../abstract/osr-base-entity";
import {Role} from "../../enums/role.enum";
import {Driver} from "../../drivers/entities/driver.entity";
import {Exclude} from "class-transformer";
import {Trip} from "../../trips/entities/trip.entity";
import {CURRENCIES, formatDateTime, isNull, SUPPORTED_COUNTRIES} from "../../utils";
import {PAYMENT_TYPE} from "../../enums/type.enum";

@Entity("users")
export class User extends OsrBaseEntity {
    @Column({nullable: true})
    first_name: string;

    @Column({
        nullable: true, transformer: {
            to(value) {
                return value;
            },
            from(value) {
                return JSON.parse(JSON.stringify(value));
            }
        }
    })
    devices: string;

    @Column({nullable: true})
    last_name: string;

    @Column({nullable: true, default:0})
    rating: number;

    @Column({nullable: true})
    full_name: string;

    @Column({nullable: true, unique: true})
    phone_number: string;

    @Exclude({toPlainOnly: true})
    @Column({nullable: true})
    password: string;

    @Column({nullable: true})
    gender: string;

    @Column({nullable: true})
    address: string;

    @Column({nullable: true})
    customer_id: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.name})
    country: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.code})
    currency: string;

    @Column({nullable: false, default: SUPPORTED_COUNTRIES.NIGERIA.symbol})
    currency_symbol: string;


    @Column({nullable: true})
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

    @Column({nullable: true})
    promo_code: string;

    @Column({nullable: false, default: false})
    is_external_id: boolean;

    @Column({nullable: false, default: false})
    has_driver_account: boolean;

    @Column({nullable: false, default: Role.RIDER})
    role: Role;

    @Column({nullable: false, default: false})
    verified: boolean;

    @OneToOne(() => Driver, (driver) => driver.user)
    driver: Driver;

    @OneToMany(() => Trip, (trip) => trip.user)
    trips: Trip[];


    initials: string;

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
