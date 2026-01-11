import {EyopBaseEntity} from "../../abstract/osr-base-entity";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {CURRENCIES, STATUS, TRANSACTION_METHOD, TRANSACTION_TYPE} from "../../enums/type.enum";
import {Card} from "../../cards/entities/card.entity";

@Entity("transactions")
export class Transaction extends EyopBaseEntity {
    @Column({nullable: false})
    type: TRANSACTION_TYPE;

    @Column({nullable: true})
    reference: string;

    @Column({nullable: true})
    transfer_id: string;

    @Column({type: "float", nullable: false})
    amount: number;

    @Column({nullable: true})
    order_id: string;

    @Column({nullable: true})
    title: string;

    @Column({nullable: true})
    card_id: string;

    @Column({nullable: false})
    method: TRANSACTION_METHOD;

    @Column({nullable: false})
    user_id: string;

    @Column({nullable: false, default: STATUS.SUCCESS})
    status: STATUS;

    @Column({default: CURRENCIES.NAIRA, nullable: false})
    currency: CURRENCIES;

    @ManyToOne(() => Card, (card) => card.transactions)
    @JoinColumn({name: 'card_id'})
    card: Card
}
