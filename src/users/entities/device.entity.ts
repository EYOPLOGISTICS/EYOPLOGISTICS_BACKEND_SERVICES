import {Column, Entity, Index, JoinColumn, ManyToOne, OneToOne} from "typeorm";
import {OsrBaseEntity} from "../../abstract/osr-base-entity";
import {User} from "./user.entity";

@Entity("devices")
export class Device extends OsrBaseEntity {
    @Column({nullable: true})
    device_id: string;

    @Column({nullable: true, name:"user_id"})
    user_id: string;

    @ManyToOne(() => User, (user) => user)
    @JoinColumn({name:'user_id'})
    user:User

}
