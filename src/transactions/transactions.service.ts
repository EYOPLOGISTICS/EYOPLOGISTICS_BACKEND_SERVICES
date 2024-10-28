import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {
    CreateTransactionDto,
    InitializeStripeTransactionDto,
    InitializeTransactionDto,
    VerifyTransactionDto
} from "./dto/create-transaction.dto";
import {UpdateTransactionDto} from "./dto/update-transaction.dto";
import {Transaction} from "./entities/transaction.entity";
import {
    PAYSTACK_WEBHOOK_EVENTS,
    STATUS,
    SuccessResponseType,
    TRANSACTION_METHOD, TRANSACTION_TYPE,
} from "../enums/type.enum";
import {User} from "../users/entities/user.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {UsersService} from "../users/users.service";
import {Card} from "../cards/entities/card.entity";
import {NotificationsService} from "../notifications/notifications.service";
import {usePusher} from "../services/pusher";
import usePaystackService from "../services/paystack";
import {getPaystackFee, SUPPORTED_COUNTRIES} from "../utils";
import {useStripePaymentGateway} from "../services/stripe";
import {UseOneSignal} from "../services/one-signal";

const {verifyTransaction, initializeTransaction} = usePaystackService;

const pusher = usePusher();

@Injectable()
export class TransactionsService {
    constructor(@Inject(forwardRef(() => UsersService)) private userService: UsersService, private notificationsService: NotificationsService) {
    }

    async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        const {
            type,
            method,
            status,
            title,
            card_id,
            user_id,
            currency,
            amount,
            payment_reference,
            transfer_id
        } = createTransactionDto;
        const transaction = new Transaction();
        transaction.type = type;
        transaction.method = method;
        transaction.status = status;
        transaction.user_id = user_id;
        transaction.reference = payment_reference;
        transaction.transfer_id = transfer_id;
        transaction.amount = amount;
        if (card_id) transaction.card_id = card_id;
        if (currency) transaction.currency = currency;
        if (title) transaction.title = title;
        await transaction.save();
        const user = await this.userService.findOne(user_id, ["wallet_balance", "id"]);
        await pusher.trigger(`private-user-${user_id}`, "new-transaction", {wallet_balance: user.wallet_balance});
        return transaction;
    }

    async findAll(user: User): Promise<Transaction[] | []> {
        return await Transaction.find({
            order: {
                created_at: "DESC"
            },
            where: [{
                method: TRANSACTION_METHOD.WALLET,
                user_id: user.id
            }, {
                method: TRANSACTION_METHOD.TRANSFER,
                user_id: user.id
            }]
        });
    }


    webhookServiceHandler(payload: any): void {
        if (payload.event === PAYSTACK_WEBHOOK_EVENTS.CHARGE_SUCCESS) {
            switch (payload.data.metadata.transaction_type) {
                case "wallet_funding":
                    this.fundWallet(payload.data);
                    break;

            }
        }

        if (payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_SUCCESS || payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_FAILED || payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_REVERSED) this.handleTransfersViaWebhook(payload);
    }

    async handleTransfersViaWebhook(payload: any): Promise<void> {
        const transfer_id = payload.data.id;
        console.log(`transfer id - ${transfer_id}`)
        const transaction = await this.findOne(transfer_id, ["transfer_id", "user_id", "status", "id"])
        let user;
        if (transaction) user = await this.userService.findOne(transaction.user_id, ["wallet_balance", "id"]);
        if (transaction && user) {
            switch (payload.event) {
                case PAYSTACK_WEBHOOK_EVENTS.TRANSFER_SUCCESS:
                    transaction.status = STATUS.SUCCESS;
                    await transaction.save();
                    await this.notificationsService.create({
                        title: "Transfer Successful...",
                        user,
                        message: `Transfer of ${transaction.amount} from your wallet to your bank account was successful`
                    });
                    break;
                case PAYSTACK_WEBHOOK_EVENTS.TRANSFER_FAILED || PAYSTACK_WEBHOOK_EVENTS.TRANSFER_REVERSED:
                    transaction.status = STATUS.FAILED;
                    await transaction.save();
                    await this.userService.creditUserWallet(user, transaction.amount, true);
                    await this.notificationsService.create({
                        title: "Transfer failed...",
                        user,
                        message: `Transfer of ${transaction.amount} from your wallet to your bank account was not successful`
                    });
                    break;
            }
        }
    }

    async fundWallet(data: any) {
        let driver;
        const user_id = data.metadata.user_id;
        let amount = data.amount / 100;
        const amount_paid = parseInt(data.metadata.amount_paid);
        if (amount_paid) {
            // const { paystack_amount } = getPaystackFee(amount_paid);
            // if (paystack_amount < amount) return false;
            amount = amount_paid;
        }
        const user = await this.userService.findOne(user_id, ["id", "wallet_balance", "role", "currency_symbol"]);
        if (user) {
            const card = data.authorization.channel === TRANSACTION_METHOD.CARD ? await this.saveCard(data, user) : null;
            await this.create({
                payment_reference: data.reference,
                title: `DEBIT`,
                type: TRANSACTION_TYPE.CREDIT,
                user_id: user.id,
                card_id: card ? card.id : null,
                method: data.channel,
                status: STATUS.SUCCESS,
                amount
            });
            await this.userService.creditUserWallet(user, amount);
        }
    }


    async verifyTransaction(user: User, verifyTransactionDto: VerifyTransactionDto): Promise<SuccessResponseType> {
        const verified = await verifyTransaction(verifyTransactionDto.payment_reference, user);
        const message = verified ? "Transaction verified successfully" : "Could not verify transaction";
        return successResponse({verified, message});
    }

    async getReference(reference: string) {
        const transaction = await this.findOne(reference, ["user_id", "reference", "id", "status", "amount"]);
        if (!transaction) returnErrorResponse("Transaction not found");
        return successResponse(transaction);
    }

    async initializeTransactionDto(user: User, initializeTransactionDto: InitializeTransactionDto): Promise<SuccessResponseType> {
        const data = await initializeTransaction(initializeTransactionDto.email, initializeTransactionDto.amount, initializeTransactionDto.metadata, initializeTransactionDto.payment_channels);
        return successResponse({access_code: data});
    }

    async initialiseStripeTransaction(user: User, initializeTransactionDto: InitializeStripeTransactionDto): Promise<SuccessResponseType> {
        const fundWallet = 'fund_wallet';
        console.log(initializeTransactionDto);
        const {transaction_type, amount} = initializeTransactionDto;
        const stripe = useStripePaymentGateway();
        let customerId = user.customer_id ?? null;
        if (!customerId) {
            const customer = await stripe.createCustomer(user.full_name, user.email)
            if (!customer) returnErrorResponse('Could not initialize stripe payment gateway')
            customerId = customer.id;
            user.customer_id = customer.id;
            await user.save();
        }

        const response = transaction_type === 'add_card' ? await stripe.createSetupIntent(customerId) : await stripe.createCheckout('Fund Your Wallet', amount, {
            transaction_type: initializeTransactionDto.transaction_type,
            user_id: user.id,
        });

        return successResponse({url: response.url})

    }


    async chargeCard(user: User) {
        const stripe = useStripePaymentGateway()
        const card = await Card.findOne({where: {user_id: user.id}})
        const response = await stripe.createPaymentIntent(user.customer_id, 200, user.email, true, card.payment_method)
        return successResponse(response)
    }

    async findOne(data: string, columns_to_load?: Array<any>): Promise<Transaction | undefined> {
        return await Transaction.findOne({
            where: [{id: data}, {reference: data}, {user_id: data}, {transfer_id: data}],
            select: columns_to_load && columns_to_load.length ? columns_to_load : ["id", "user_id", "reference"]
        });
    }


    async saveCard(data, user) {
        let card = await Card.findOne({where: {signature: data.authorization.signature, user_id: user.id}});
        if (!card) {
            card = new Card();
        }
        card.bank = data.authorization.bank;
        card.last4 = data.authorization.last4;
        card.signature = data.authorization.signature;
        card.auth_code = data.authorization.authorization_code;
        card.bin = data.authorization.bin;
        card.exp_month = data.authorization.exp_month;
        card.exp_year = data.authorization.exp_year;
        card.channel = data.authorization.channel;
        card.country_code = data.authorization.country_code;
        card.brand = data.authorization.brand;
        card.reusable = data.authorization.reusable;
        card.card_type = data.authorization.card_type;
        card.user_id = user.id;
        card.email = data.customer.email;
        card.name = data.customer.first_name + " " + data.customer.last_name ?? user.first_name + " " + user.last_name;
        await card.save();
        return card;
    }
}
