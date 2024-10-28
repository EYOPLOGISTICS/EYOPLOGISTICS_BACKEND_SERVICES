import { EyopBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity } from "typeorm";

@Entity("activities")
export class Activity extends EyopBaseEntity {

    @Column({ nullable: false })
    activity: string;

    @Column({nullable:true})
    user_id: string;

    @Column({nullable:true})
    vendor_id: string;
}
