import {Card} from "../cards/entities/card.entity";
import {User} from "../users/entities/user.entity";
import {returnErrorResponse} from "../utils/response";
import {CURRENCIES, TRANSACTION_METHOD} from "../enums/type.enum";
import {TransactionsService} from "../transactions/transactions.service";

const crypto = require("crypto");
const axios = require("axios");

const usePaystackService = () => {
    const createTransferRecipient = async (account_number: string, account_name: string, bank_code: string, currency?: string) => {
        try {
            const options = {
                headers: header()
            };
            const data = {
                type: "nuban",
                account_number,
                name: account_name,
                bank_code,
                currency: currency ? currency : CURRENCIES.NAIRA
            };
            const response = await axios.post("https://api.paystack.co/transferrecipient", data, options);
            return response.data.data;
        } catch (e) {
            console.log(e);
            returnErrorResponse("Could not save bank details");
        }

    };

    const initiateTransfer = async (amount: number, recipient_code: string, reference?: string) => {
        try {
            const options = {
                headers: header()
            };
            const data = {
                source: "balance",
                reason: "payout",
                amount: amount * 100,
                recipient: recipient_code,
                reference: reference ?? getReference()
            };
            const response = await axios.post("https://api.paystack.co/transfer", data, options);
            const response_data = response.data.data;
            if (response.data.status) return response_data;
            // await initiateTransfer(amount, recipient_code, response_data.reference);
        } catch (e) {
            console.log(e.response.data.message);
            returnErrorResponse(e.response.data.message);
        }
    };

    const getReference = () => {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
    const verifyTransaction = async (reference: string, user: User) => {
        try {
            const options = {
                headers: header()
            };
            const response = await axios.get("https://api.paystack.co/transaction/verify/" + reference, options);
            console.log("verified");
            if (response.data.status) {
                // console.log(response.data.data)
                if (response.data.data.authorization.channel === TRANSACTION_METHOD.CARD) await saveCard(response.data.data, user);
                return true;
            }
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }

    };


    const initializeTransaction = async (email: string, amount: number, metadata: any, payment_channels?: Array<string>) => {
        try {
            const options = {
                headers: header()
            };
            const data = {
                email,
                amount: amount * 100,
                metadata,
                channels: payment_channels && payment_channels.length  ? payment_channels : ['card', 'bank', 'ussd', 'bank_transfer']
            };
            const response = await axios.post("https://api.paystack.co/transaction/initialize", data, options);
            console.log(response.data.data);
            return response.data.data;
        } catch (e) {
            console.log(e);
            returnErrorResponse("Could not initialize transaction");
        }

    };


    const getNigerianBanks = async () => {
        const options = {
            headers: header()
        };
        const response = await axios.get("https://api.paystack.co/bank", options);
        if (response.status) return response.data.data;
        return [];
    };


    const verifyBankAccount = async (account_number: string, bank_code: string) => {
        try {
            const options = {
                headers: header()
            };
            const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, options);
            return response.data.data;
        } catch (e) {
            console.log(e.response)
          e.response.data == 'Could not resolve account name. Check parameters or try again.' ? returnErrorResponse(e.response.data) : returnErrorResponse('Oops, seems our network is poor please try again');
        }


    };

    const saveCard = async (data, user) => {
        console.log('saving card')
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
        return {card};
    };

    const chargeCard = async (card: Card, amount, user: User) => {
        try {
            const options = {
                headers: header()
            };
            const data = {
                email: card.email,
                amount: amount * 100,
                authorization_code: card.auth_code
            };
            const response = await axios.post("https://api.paystack.co/transaction/charge_authorization", data, options);
            if (response.data.status === true) return await verifyTransaction(response.data.data.reference, user);
            return false;
        } catch (e) {
            return false;
        }
    };

    const header = () => {
        const APIKEY = process.env.NODE_ENV === "production" ? process.env.PAYSTACK_SECRET_KEY : process.env.PAYSTACK_TEST_SECRET_KEY;
        const Bearer = `Bearer ${APIKEY}`;
        return {
            Authorization: Bearer,
            "content-type": "application/json"
        };
    };


    const authenticate = (req_body: any, paystack_signature: any) => {
        const APIKEY = process.env.NODE_ENV === "production" ? process.env.PAYSTACK_SECRET_KEY : process.env.PAYSTACK_TEST_SECRET_KEY;
        const hash = crypto.createHmac("sha512", APIKEY).update(JSON.stringify(req_body)).digest("hex");
        return hash == paystack_signature;
    };

    return {
        verifyTransaction,
        initializeTransaction,
        chargeCard,
        verifyBankAccount,
        authenticate,
        getNigerianBanks,
        saveCard,
        createTransferRecipient,
        initiateTransfer
    };
};

export default usePaystackService();