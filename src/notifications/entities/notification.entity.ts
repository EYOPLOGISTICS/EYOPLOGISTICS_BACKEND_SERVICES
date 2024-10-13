import { OsrBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity } from "typeorm";

@Entity("notifications")
export class Notification extends OsrBaseEntity {
  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  message: string;

  @Column()
  user_id: string;
}
