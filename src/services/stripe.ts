const stripe = require('stripe')
export const useStripePaymentGateway = () => {

    const createCustomer = async (full_name: string, email: string) => {
        try {
            return await stripe.customers.create({
                name: full_name,
                email: email,
            })
        } catch (e) {
            console.log(e)
            return null
        }
    }

    const createSetupIntent = async (customer_id: string) => {
        try {
            return await stripe.checkout.sessions.create({
                mode: 'setup',
                currency: 'usd',
                customer: customer_id,
                success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
            })
        } catch (e) {
            console.log(e)
            return null;
        }
    }

    const retrieveSession = async (session_id: string) => {
        return await stripe.checkout.sessions.retrieve(session_id);
    }

    const retrieveSetupIntent = async (setup_intent_id) => {
        try {
            return await stripe.setupIntents.retrieve(setup_intent_id)
        } catch (e) {
            console.log(e)
            return null
        }
    }

    const retrievePaymentMethod = async (payment_method: string) => {
        try {
            return await stripe.paymentMethods.retrieve(
                payment_method
            );
        } catch (e) {
            return null
        }
    }

    const retrieveCustomerPaymentMethods = async (customer_id: string) => {
        try {
            return await stripe.customers.listPaymentMethods(
                customer_id,
                {
                    limit: 10,
                }
            );
        } catch (e) {
            console.log(e)
            return null
        }
    }

    const createPaymentIntent = async (customer_id: string, amount: number, email: string, confirm = false, payment_method: string = null, meta_data = {}) => {
        try {
            return await stripe.paymentIntents.create({
                meta_data: meta_data,
                customer: customer_id,
                receipt_email: email,
                confirm,
                payment_method: payment_method,
                amount,
                return_url: 'https://example.com/order/123/complete',
                currency: 'usd',
                off_session: confirm,
                // setup_future_usage: 'off_session',
                automatic_payment_methods: {
                    enabled: true,
                },
            })
        } catch (e) {
            console.log(e)
            return null
        }
    }

    const createCheckout = async (product_name: string, amount: number, metadata = {}) => {
        try {
            return await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: product_name,
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ],
                metadata,
                mode: 'payment',
                success_url: 'http://localhost:4242/success',
                cancel_url: 'http://localhost:4242/cancel',
            });
        } catch (e) {
            console.log(e)
        }
    }

    const connectAccount = async (email: string) => {
        try {
            return await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: email,
                capabilities: {
                    // bank_transfer_payments: {
                    //     requested:true
                    // },
                    transfers: {
                        requested: true
                    }
                },
                business_type: 'individual',
                business_profile: {
                    mcc: '4789',
                    name: 'Osr Cruise',
                    url: 'https://osrcruise.com/',
                    product_description: 'Ride Hailing Services'
                }
            })
        } catch (e) {
            console.log(e.data)
            console.log(e.message)
            return null
        }
    }

    const createAccountLink = async (accountId: string) => {
        try {
            return await stripe.accountLinks.create({
                account: accountId,
                refresh_url: 'https://example.com/reauth',
                return_url: 'https://staging-api.osrcruise.com/v1/stripe/webhook/connect',
                type: 'account_onboarding',
                collect: 'eventually_due'
            });
        } catch (e) {
            return null
        }
    }

    const payoutToConnectedAccount = async (accountId: string, amount: number) => {
        try {
            return await stripe.transfers.create({
                amount,
                currency: "usd",
                destination: accountId,
            });
        } catch (e) {
            console.log(e)
            return null;
        }
    }
    return {
        retrievePaymentMethod,
        payoutToConnectedAccount,
        createAccountLink,
        createCustomer,
        createPaymentIntent,
        createSetupIntent,
        retrieveSession,
        retrieveSetupIntent,
        retrieveCustomerPaymentMethods,
        createCheckout,
        connectAccount
    }
}