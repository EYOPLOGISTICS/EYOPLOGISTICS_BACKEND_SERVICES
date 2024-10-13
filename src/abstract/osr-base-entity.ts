import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export abstract class OsrBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: string;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at:Date
}
