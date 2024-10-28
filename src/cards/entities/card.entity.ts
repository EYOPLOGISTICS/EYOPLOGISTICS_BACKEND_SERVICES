import {Column, Entity, OneToMany} from "typeorm";
import { EyopBaseEntity } from "../../abstract/osr-base-entity";
import {Transaction} from "../../transactions/entities/transaction.entity";

@Entity('cards')
export class Card extends EyopBaseEntity{
  @Column({nullable:false})
  auth_code:string

  @Column({nullable:false, default:false})
  default:boolean

  @Column({nullable:false})
  bin:string

  @Column({nullable:false})
  name:string

  @Column({nullable:false})
  last4:string

  @Column({nullable:false})
  exp_month:string

  @Column({nullable:false})
  exp_year:string

  @Column({nullable:false})
  channel:string

  @Column({nullable:true})
  card_type:string

  @Column({nullable:false})
  bank:string

  @Column({nullable:false})
  country_code:string

  @Column({nullable:true})
  brand:string

  @Column({nullable:true})
  funding:string

  @Column({nullable:true})
  payment_method:string

  @Column({nullable:false})
  email:string

  @Column({nullable:false})
  reusable:boolean

  @Column({nullable:false})
  signature:string

  @Column({nullable:false})
  user_id:string

  @OneToMany(() => Transaction, (transactions) => transactions.card)
  transactions:Transaction[]

}
