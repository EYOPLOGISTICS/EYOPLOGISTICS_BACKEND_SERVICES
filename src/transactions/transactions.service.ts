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
    TRANSACTION_METHOD,
    TRANSACTION_TYPE
} from "../enums/type.enum";
import {User} from "../users/entities/user.entity";
import {returnErrorResponse, successResponse} from "../utils/response";
import {UsersService} from "../users/users.service";
import {Card} from "../cards/entities/card.entity";
import {NotificationsService} from "../notifications/notifications.service";
import {usePusher} from "../services/pusher";
import {DriversService} from "../drivers/drivers.service";
import {Trip} from "../trips/entities/trip.entity";
import usePaystackService from "../services/paystack";
import {getPaystackFee, SUPPORTED_COUNTRIES} from "../utils";
import {RideSharingOrder} from "../ride_sharing/entities/ride_sharing_order.entity";
import {useStripePaymentGateway} from "../services/stripe";
import {BankDetails} from "../drivers/entities/bank_details.entity";
import {UseOneSignal} from "../services/one-signal";

const {verifyTransaction, initializeTransaction} = usePaystackService;

const pusher = usePusher();

@Injectable()
export class TransactionsService {
    constructor(@Inject(forwardRef(() => UsersService)) private userService: UsersService, private notificationsService: NotificationsService, @Inject(forwardRef(() => DriversService)) private driverService: DriversService) {
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
                case "trip_payment":
                    this.makeTripPaymentViaWebhook(payload.data);
                    break;
                case "tip_payment":
                    this.tipDriverViaWebhook(payload.data);
                    break;
                case "ride_sharing":
                    this.handleRideSharing(payload.data)

            }
        }

        if (payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_SUCCESS || payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_FAILED || payload.event === PAYSTACK_WEBHOOK_EVENTS.TRANSFER_REVERSED) this.handleTransfersViaWebhook(payload);
    }

    async stripeWebhookHandler(event) {
        switch (event.type) {
            case 'checkout.session.completed':
                this.handleCheckoutSessionCompleted(event)
                break;
            case 'account.updated' :
                this.handleAccountUpdatedEvent(event)
                break;
        }
    }

    async handleAccountUpdatedEvent(event) {
        const account = await BankDetails.findOne({where: {stripe_account_id: event.data.object.id}})
        if (account && !account.details_submitted) {
            console.log(`updating account - ${event.data.object.payouts_enabled}`)
            account.transfer_enabled = event.data.object.payout_enabled;
            account.details_submitted = event.data.object.details_submitted;
            const bankObj = event.data.object.external_accounts.data[0]
            account.account_name = bankObj.account_holder_name;
            account.bank_name = bankObj.bank_name;
            account.account_number = bankObj.last4;
            account.currency = bankObj.currency;
            account.routing_no = bankObj.routing_number;
            await account.save();
            if (event.data.object.details_submitted && event.data.object.payout_enabled) {
                const count = await BankDetails.count({where: {driver_id: account.driver_id}})
                UseOneSignal().sendNotificationToDriver('Account connected successfully', `Your bank account has been connected successfully with Osr Cruise ${count > 1 ? ', you can now make withdrawals from your wallet into your connected account' : ''}`, account.driver_id, {})
            }
        }
    }

    async handleCheckoutSessionCompleted(event) {
        const stripeService = useStripePaymentGateway();
        if (event.data.object.metadata.transaction_type === 'fund_wallet') {
            const event_data = event.data.object
            const user_id = event_data.metadata.user_id;
            const session_id = event_data.id;
            const amount = event_data.amount_total;
            const user = await User.findOne({where: {id: user_id}})
            if (user) {
                const checkout = await stripeService.retrieveSession(session_id)
                if (checkout && checkout.payment_status !== 'unpaid') {
                    await this.userService.creditUserWallet(user, amount)
                }
            }
        } else if
        (event.data.object.mode === 'setup') {
            const setupIntent = await stripeService.retrieveSetupIntent(event.data.object.setup_intent)
            if (!setupIntent) return
            const user = await User.findOne({
                where: {customer_id: setupIntent.customer},
                select: {id: true, customer_id: true}
            })
            if (user) {
                if (!await Card.findOneBy({payment_method: setupIntent.payment_method})) {
                    const newlyAddedPaymentMethod = await stripeService.retrievePaymentMethod(setupIntent.payment_method)
                    await Card.update({user_id: user.id, default: true}, {default: false})
                    const paymentMethod = new Card();
                    paymentMethod.payment_method = setupIntent.payment_method;
                    paymentMethod.user_id = user.id;
                    paymentMethod.last4 = newlyAddedPaymentMethod.card.last4.toString();
                    paymentMethod.card_type = newlyAddedPaymentMethod.card.brand;
                    paymentMethod.brand = newlyAddedPaymentMethod.card.brand;
                    paymentMethod.funding = newlyAddedPaymentMethod.card.funding;
                    paymentMethod.exp_year = newlyAddedPaymentMethod.card.exp_year.toString();
                    paymentMethod.exp_month = newlyAddedPaymentMethod.card.exp_month.toString();
                    paymentMethod.name = newlyAddedPaymentMethod.billing_details.name;
                    paymentMethod.default = true;
                    await paymentMethod.save();
                }
            }
        }
    }


    async handleRideSharing(payload: any) {
        const order_id = payload.metadata.order_id;
        const ride_sharing_order = await RideSharingOrder.findOne({
            where: {id: order_id},
            select: ['id', 'paid', 'user_id', 'booked_by']
        })
        ride_sharing_order.paid = true;
        ride_sharing_order.payment_type = payload.authorization.channel;
        await ride_sharing_order.save();
        // send mails
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
        let user = await this.userService.findOne(user_id, ["id", "wallet_balance", "role", "currency_symbol"]);
        if (!user) {
            // check if it's a driver and then get his user data
            driver = await this.driverService.findOne(user_id, ["id", "user_id"]);
            if (driver) user = await this.userService.findOne(driver.user_id, ["id", "wallet_balance", "role", "currency_symbol"]);
        }
        if (user) {
            const card = data.authorization.channel === TRANSACTION_METHOD.CARD ? await this.saveCard(data, user) : null;
            await this.create({
                payment_reference: data.reference,
                title: `DEBIT`,
                type: TRANSACTION_TYPE.DEBIT,
                user_id: user.id,
                card_id: card ? card.id : null,
                method: data.channel,
                status: STATUS.SUCCESS,
                amount
            });
            await this.userService.creditUserWallet(user, amount);
            if (driver) this.driverService.checkIfDriverHasPendingPaymentAndDebit(driver);
        }
    }

    async tipDriverViaWebhook(data: any) {
        const trip_id = data.metadata.trip_id;
        let amount = data.amount / 100;
        const amount_paid = parseInt(data.metadata.amount_paid);
        if (amount_paid) {
            const {paystack_amount} = getPaystackFee(amount_paid);
            if (paystack_amount < amount) return false;
            amount = amount_paid;
        }
        const trip = await Trip.findOne({
            where: {id: trip_id},
            select: ["id", "driver_id", "origin_address", "destination_address"]
        });
        if (trip) {
            const driver = await this.driverService.findOne(trip.driver_id);
            await this.driverService.tipDriver(driver, trip, amount);
            const rider = await this.userService.findOne(trip.user_id, ["id"]);
            const card = data.authorization.channel === TRANSACTION_METHOD.CARD ? await this.saveCard(data, rider) : null;
            await this.create({
                payment_reference: data.reference,
                title: `DEBIT`,
                type: TRANSACTION_TYPE.DEBIT,
                user_id: rider.id,
                card_id: card ? card.id : null,
                method: TRANSACTION_METHOD.CARD,
                status: STATUS.SUCCESS,
                amount
            });
        }

    }

    async makeTripPaymentViaWebhook(data: any) {
        const amount = data.amount / 100;
        const trip_id = data.metadata.trip_id;
        const trip = await Trip.findOne({
            where: {id: trip_id},
            select: ["driver_id", "user_id", "id", "payment_status"]
        });
        if (trip) {
            const user = await this.userService.findOne(trip.user_id, ["id"]);
            trip.payment_status = STATUS.PAID;
            await trip.save();
            const card = data.authorization.channel === TRANSACTION_METHOD.CARD ? await this.saveCard(data, user) : null;
            await this.create({
                payment_reference: data.reference,
                title: `DEBIT`,
                type: TRANSACTION_TYPE.DEBIT,
                user_id: user.id,
                card_id: card ? card.id : null,
                method: data.channel,
                status: STATUS.SUCCESS,
                amount
            });
            await this.notificationsService.create({
                user: user,
                message: `Payment for ${trip.origin_address} to ${trip.destination_address} ride`,
                title: "Ride Payment"
            });
        } else {
            console.log("trip not found");
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
