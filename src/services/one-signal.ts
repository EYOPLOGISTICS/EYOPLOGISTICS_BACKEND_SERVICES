import axios from "axios";
import {returnErrorResponse, successResponse} from "../utils/response";

export const UseOneSignal = () => {

    const sendNotification = async (title, description, externalId, payload) => {
        const notification = {
            "app_id": process.env.ONE_SIGNAL_APP_ID,
            headings: {en: title},
            contents: {
                en: description
            },
            "include_external_user_ids": [externalId],
            // large_icon: "https://play-lh.googleusercontent.com/W-awW3br2vog0aXhfpZ_W3h5lIY-o8EJECchVtyM5vRebx9vSTY3I6E2YvHgNp3ShPQ=w480-h960-rw",
            // big_picture: "https://www.bigpicture.com",
            data: {payload}
        };
        console.log('sending via external id for driver ')
        console.log('sending via external id for driver')
        console.log('sending via external id for driver')
        if (title.includes('New Ride Request') || title.includes('Welcome To Osr Cruise')){
            notification['android_channel_id'] = '80f8b0f0-1dcd-4a4f-ab2c-9708f349ffba'
            notification['ios_sound'] = 'new_ride_request.wav'
        }
        const headers = {
            Authorization: "Basic " + process.env.ONE_SIGNAL_API_KEY,
            "Content-Type": "application/json"
        };
       try {
           const res = await axios.post("https://onesignal.com/api/v1/notifications", notification, {headers});
           console.log('sent')
       } catch (e) {
           console.log(e.response)
           console.log('something went wrong while sending push')
           return false
       }
    }



    return {sendNotification};
};