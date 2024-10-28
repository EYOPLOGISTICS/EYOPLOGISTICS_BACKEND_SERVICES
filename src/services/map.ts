import {roundPosition} from "../utils";

const {Client} = require("@googlemaps/google-maps-services-js");

const client = new Client({});

export const useGoogleMapServices = () => {


    const calculateDeliveryFee = async (origin = "33.74829562470758,-84.22327453508204", destination = "33.7631057,-84.21027") => {
        const feePerKm = 13;
        const feePerMin = 2;
        try {
            const response = await client.distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    key: process.env.GOOGLE_MAP_API_KEY
                }
            });
            if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") return null;
            // console.log(response.data.rows[0].elements);
            const km = response.data.rows[0].elements[0].distance.value / 1000;
            const km_int = parseFloat(km.toFixed(1));
            const km_fee_total = feePerKm * parseFloat(km.toFixed(1));
            const time = Math.round(response.data.rows[0].elements[0].duration.value / 60);
            const time_fee_total = feePerMin * time;
            const deliveryFee = roundPosition(Math.round(km_fee_total), 2);
            console.log(km_fee_total)
            console.log(time_fee_total)
            return {
                km: km_int,
                time: time,
                duration: response.data.rows[0].elements[0].duration.text,
                kilometers: response.data.rows[0].elements[0].distance.text,
                delivery_fee:deliveryFee,
            };
        } catch (e) {
            console.log(e);
            return null;
        }
    };


    const getStateFromLatAndLng = async (lat_and_lng = '33.74829562470758,-84.22327453508204'): Promise<{ state: string, address: string, country: string }> => {
        const response = await client.reverseGeocode({
            params: {
                latlng: lat_and_lng,
                key: process.env.GOOGLE_MAP_API_KEY
            }
        })
        const result = response.data.results[0];
        const address = result.formatted_address;
        const state = result.address_components.find(address => address.types.includes('administrative_area_level_1')).long_name
        const country = result.address_components.find(address => address.types.includes('country')).long_name
        return {state, address, country}
    }

    const formatLatAndLng = (lat, lng) => {
        return `${lat},${lng}`;
    };


    return {
        calculateDeliveryFee,
        formatLatAndLng,
        getStateFromLatAndLng,
    };
};