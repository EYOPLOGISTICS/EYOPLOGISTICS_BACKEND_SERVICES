import { EyopBaseEntity } from "../../abstract/osr-base-entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Role } from "../../enums/role.enum";
import {Product} from "../../products/entities/product.entity";

@Entity("ratings")
export class Rating extends EyopBaseEntity {
  @Column({ nullable: false })
  star: number;

  @Column({ nullable: false })
  product_id: string;

  @Column({ nullable: true })
  review: string;

  @Column({ nullable: false, name:'user_id' })
  user_id: string;

  @ManyToOne(() => User, (trip) => trip, {})
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Product, (product) => product, {
    onDelete:'CASCADE'
  })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
