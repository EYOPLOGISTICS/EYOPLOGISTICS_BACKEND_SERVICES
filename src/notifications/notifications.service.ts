import {Injectable} from "@nestjs/common";
import {CreateNotificationDto} from "./dto/create-notification.dto";
import {User} from "../users/entities/user.entity";
import {ErrorResponseType, SuccessResponseType} from "../enums/type.enum";
import {Notification} from "./entities/notification.entity";
import {successResponse} from "../utils/response";
import {usePusher} from "../services/pusher";
import {Activity} from "./entities/activity.entity";
import {Role} from "../enums/role.enum";
const pusher = usePusher();

@Injectable()
export class NotificationsService {
    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const {title, message, user, vendor_id, action_by} = createNotificationDto;
        const notification = new Notification();
        notification.user_id = user.id;
        notification.message = message;
        notification.title = title;
        notification.vendor_id = vendor_id;
        notification.action_by = action_by ? action_by : 'user'
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

    async findAll(user: User, vendorId?: string): Promise<SuccessResponseType | ErrorResponseType> {
        const conditions = {};
        if (vendorId != null) {
            conditions['vendor_id'] = vendorId;
            conditions['action_by'] = Role.VENDOR;
        } else {
            conditions['user_id'] = user.id;
        }
        let notifications = await Notification.find({
            order: {created_at: 'DESC'},
            where: conditions,
            take: 50
        });
        if (!notifications.length) {
            if (!vendorId) {
                const note = new Notification();
                note.title = `Dear ${user.first_name}`;
                note.message = `Welcome to Eyop Online Store`
                note.user_id = user.id;
                note.action_by = 'user';
                await note.save();
                notifications = await Notification.find({
                    order: {created_at: 'DESC'},
                    where: conditions,
                    take: 50
                });
            }

        }
        return successResponse({notifications});
    }

}
