import { OsrBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Role } from "../../enums/role.enum";

@Entity("ratings")
export class Rating extends OsrBaseEntity {
  @Column({ nullable: false })
  star: number;

  @Column({ nullable: false })
  driver_id: string;

  @Column({ nullable: false })
  rated_by: Role;

  @Column({ nullable: true })
  review: string;

  @Column({ nullable: false })
  trip_id: string;

  @Column({ nullable: false, name:'user_id' })
  user_id: string;

  @ManyToOne(() => User, (trip) => trip, {})
  @JoinColumn({ name: "user_id" })
  user: User;
}
