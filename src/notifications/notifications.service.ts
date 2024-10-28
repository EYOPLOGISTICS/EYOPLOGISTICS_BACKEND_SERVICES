import {Injectable} from "@nestjs/common";
import {CreateNotificationDto} from "./dto/create-notification.dto";
import {User} from "../users/entities/user.entity";
import {ErrorResponseType, SuccessResponseType} from "../enums/type.enum";
import {Notification} from "./entities/notification.entity";
import {successResponse} from "../utils/response";
import {usePusher} from "../services/pusher";
import {Activity} from "./entities/activity.entity";

const pusher = usePusher();

@Injectable()
export class NotificationsService {
    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const {title, message, user} = createNotificationDto;
        const notification = new Notification();
        notification.user_id = user.id;
        notification.message = message;
        notification.title = title;
        await notification.save();
        await pusher.trigger(`private-user-${user.id}`, 'new-notification', {notification});
        return notification;
    }

    async createActivity(activity: string, user_id: string, vendor_id?: string) {
        const newActivity = new Activity();
        newActivity.user_id = user_id;
        newActivity.activity = activity;
        newActivity.vendor_id = vendor_id;
        await newActivity.save();
        return true;
    }

    async findAll(user: User): Promise<SuccessResponseType | ErrorResponseType> {
        const notifications = await Notification.find({
            order: {created_at: 'DESC'},
            where: {user_id: user.id},
            take: 50
        });
        return successResponse({notifications});
    }

}
