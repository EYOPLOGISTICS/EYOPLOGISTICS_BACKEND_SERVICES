import { User } from "../../users/entities/user.entity";

export class CreateNotificationDto {
  title:string
  message:string

  user:User

}
