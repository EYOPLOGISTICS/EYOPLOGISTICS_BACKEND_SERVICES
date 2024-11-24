import { EyopBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Role } from "../../enums/role.enum";
import {Product} from "../../products/entities/product.entity";
import {Vendor} from "../../vendors/entities/vendor.entity";

@Entity("ratings")
export class Rating extends EyopBaseEntity {
  @Column({ nullable: false })
  star: number;

  @Column({ nullable: true })
  order_id: string;

  // @Column({ nullable: true })
  // product_id: string;

  @Column({ nullable: true })
  vendor_id: string;

  @Column({ nullable: true })
  review: string;

  @Column({ nullable: false, name:'user_id' })
  user_id: string;

  @ManyToOne(() => User, (trip) => trip, {})
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Vendor, (product) => product, {
    onDelete:'CASCADE'
  })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;
}
