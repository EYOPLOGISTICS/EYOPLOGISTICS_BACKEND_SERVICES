const axios = require("axios");

export function useSendCharmHeader() {
    const APIKEY = process.env.SEND_CHARM_API_KEY;
    const Bearer = `Bearer ${APIKEY}`;
    return {
        Authorization: Bearer,
        "content-type": "application/json"
    };
}


export async function sendSmsWithSendCharm(to: string | string[], message: string) {
    try {
        const options = {
            headers: useSendCharmHeader()
        };
        const body = {
            to,
            message,
            sender_name: "OSR CRUISE",
            route: "dnd"

        };
        await axios.post("https://api.sendchamp.com/api/v1/sms/send", body, options);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}


export async function sendSmsWithTemi(to: string | string[], message: string) {
    try {
        const options = {
            headers: useSendCharmHeader()
        };
        const body = {
            to,
            message,
            sender_name: "OSR CRUISE",
            route: "dnd"

        };
        const response = await axios.post("https://api.sendchamp.com/api/v1/sms/send", body, options);
        console.log(response.data);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }

}

export const sendWhatsAppMessage = async (phone, message) => {
    phone = phone.replace('+', '')
    console.log(phone)
    const body = {
        to: phone,
        message,
        uid: phone,
        company_message_channel_id: process.env.WHATSAPP_COMPANY_ID,
        via: 9,
        device_id: '2349117860380'
    }
    try {
        await axios.post("https://api.stacksend.com/api/bot/send-message-via-request", body);
    } catch (e) {
        console.log(e)
    }

}

