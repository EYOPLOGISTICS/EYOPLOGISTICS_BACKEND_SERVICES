import {Injectable} from "@nestjs/common";
import {UpdateUserDto} from "./dto/update-user.dto";
import {User} from "./entities/user.entity";
import {Role} from "../enums/role.enum";
import {returnErrorResponse, successResponse} from "../utils/response";
import {DataSource, Not} from "typeorm";
import {QueueService} from "../queues/queue.service";
import {useB2FileUpload} from "../services/file-upload";
import {STATUS, TRANSACTION_METHOD, TRANSACTION_TYPE} from "../enums/type.enum";
import {TransactionsService} from "../transactions/transactions.service";
import {Card} from "../cards/entities/card.entity";
import {NotificationsService} from "../notifications/notifications.service";
import {SUPPORTED_COUNTRIES} from "../utils";
import {UseOneSignal} from "../services/one-signal";
import {ChangePassword} from "./dto/create-user.dto";
const bcrypt = require("bcrypt");

@Injectable()
export class UsersService {
    constructor(private dataSource: DataSource, private queueService: QueueService, private transactionsService: TransactionsService, private notificationsService: NotificationsService) {
    }

    async getUserCards(user: User) {
        const cards = await Card.find({
            relations:{transactions:true},
            where: {user_id: user.id},
            select: ["last4", "exp_year", "exp_month", "bank", "name", "id", "default", "funding", "user_id", ]
        });
        return successResponse({user_cards: cards});
    }

    async findOne(data: any, columns_to_load?: Array<any>): Promise<User | undefined> {
        return await User.findOne({
            select: columns_to_load && columns_to_load.length ? columns_to_load : ["email", "id", "phone_number", "first_name", "last_name", "full_name", "address", "profile_picture", "wallet_balance", "is_active", "role", "verified"],
            where: [
                {email: data},
                {id: data},
                {phone_number: data}
            ]
        });
    }

    async creditUserWallet(user: User, amount: number, is_refund?: boolean): Promise<boolean> {
        user.wallet_balance += amount;
        await user.save();
        await this.transactionsService.create({
            title: `CREDIT${is_refund ? "(reversal)" : ""}`,
            type: TRANSACTION_TYPE.CREDIT,
            user_id: user.id,
            method: TRANSACTION_METHOD.WALLET,
            status: STATUS.SUCCESS,
            amount
        });
        await this.notificationsService.create({
            message: `${amount} has been credited into your wallet`,
            user,
            title: "Wallet Credit"
        });
        const onesignal = UseOneSignal();
        onesignal.sendNotification('Wallet Account Credited Successfully', `You wallet has been credited with ${user.currency_symbol}${amount}`, user.id, {});

        return true;
    }

    async debitUserWallet(user: User, amount: number): Promise<boolean> {
        user.wallet_balance -= amount;
        await user.save();
        await this.transactionsService.create({
            title: "DEBIT",
            type: TRANSACTION_TYPE.DEBIT,
            user_id: user.id,
            method: TRANSACTION_METHOD.WALLET,
            status: STATUS.SUCCESS,
            amount
        });
        await this.notificationsService.create({
            message: `${amount} has been debited from your wallet`,
            user,
            title: "Wallet Debit"
        });
        return true;
    }

    async createUser(role: Role, email: string, phone_number: string): Promise<User> {
        const user = new User();
        user.email = email;
        user.phone_number = phone_number;
        user.role = role;
        await user.save();
        return user;
    }


    async updateUser(user: User, updateUserDto: UpdateUserDto, profile_picture?: Express.Multer.File) {
        const {
            first_name,
            last_name,
            phone_number,
            email,
            address,
            country,
            city
        } = updateUserDto;
        let uploaded_profile_picture;
        if (profile_picture) uploaded_profile_picture = await useB2FileUpload(profile_picture.originalname, profile_picture.buffer);
        if (await User.findOne({
            where: [{email: email, id: Not(user.id), phone_number: phone_number}, {
                email: email,
                id: Not(user.id)
            }, {id: Not(user.id), phone_number: phone_number}]
        })) returnErrorResponse("A user with this email or phone number already exist");
        user.first_name = first_name;
        user.last_name = last_name;
        user.full_name = first_name + " " + last_name;
        user.phone_number = phone_number;
        user.email = email;
        if (country) {
            user.country = country;
            user.currency_symbol = country === SUPPORTED_COUNTRIES.USA.name ? SUPPORTED_COUNTRIES.USA.symbol : SUPPORTED_COUNTRIES.NIGERIA.symbol
            user.currency = country === SUPPORTED_COUNTRIES.USA.name ? SUPPORTED_COUNTRIES.USA.code : SUPPORTED_COUNTRIES.NIGERIA.code
            user.city = city;
        }
        if (uploaded_profile_picture) user.profile_picture = uploaded_profile_picture;
        user.address = address;
        await user.save();
        return user;
    }

    async remove(id: string) {
        const user = await this.findOne(id);
        if (!user) returnErrorResponse("User does not exist");
        await user.remove();
        return successResponse({user, message: "user removed successfully"});
    }

    async changePassword(changePassword: ChangePassword, user: User) {
        const { password, confirm_password, new_password } = changePassword;
        if (confirm_password !== new_password) returnErrorResponse("password dont match");
        const userData = await User.findOne({where:{id:user.id}, select:{email:true, password:true}})
        if (!await this.comparePassword(userData.password, password)) returnErrorResponse("Invalid current password");
        userData.password = await bcrypt.hash(new_password, 10);
        await userData.save();
        return successResponse("password updated successfully");
    }

    async comparePassword(hashedPassword: string, password: string): Promise<any> {
        return await bcrypt.compare(
            password,
            hashedPassword
        );

    }
}
