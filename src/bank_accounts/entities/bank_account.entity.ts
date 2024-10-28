import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne} from "typeorm";
import { CURRENCIES } from "../../enums/type.enum";

@Entity("bank_accounts")
export class BankAccount extends EyopBaseEntity {
    @Column({ nullable: true })
    account_name: string;

    @Column({ nullable: true })
    recipient_code: string;

    @Column({ nullable: true, default:CURRENCIES.NAIRA })
    currency: CURRENCIES;


    @Column({ nullable: true,})
    recipient_id: string;

    @Column({ nullable: true })
    auth_code: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    bank_name: string;

    @Column({ nullable: true})
    account_number: string;

    @Column({ nullable: true })
    bank_id: string;

    @Column({ nullable: true })
    bank_code: string;

    @Column({ nullable: true, name:'vendor_id' })
    vendor_id: string;

    @Column({ nullable: true, name:'user_id' })
    user_id: string;


    // @Column({ nullable: false, default:false })
    // default: boolean;

}
