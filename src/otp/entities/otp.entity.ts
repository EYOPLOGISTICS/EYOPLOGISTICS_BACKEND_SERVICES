import { EyopBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity } from "typeorm";

@Entity('otp_s')
export class Otp extends EyopBaseEntity{
  @Column()
  otp:number

  @Column({nullable:true})
  email:string

  @Column({nullable:true})
  phone_number:string

  @Column({nullable:false, default:false})
  verified:boolean

}
