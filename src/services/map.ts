import {roundPosition, SUPPORTED_COUNTRIES} from "../utils";
import {Driver} from "../drivers/entities/driver.entity";
import {AppSettings} from "../admin/entities/app-settings.entity";

const {Client} = require("@googlemaps/google-maps-services-js");

const client = new Client({});

export const useGoogleMapServices = () => {

    const getStateFromLatAndLng = async (lat_and_lng = '33.74829562470758,-84.22327453508204') => {
        const response = await client.reverseGeocode({
            params: {
                latlng: lat_and_lng,
                key: process.env.GOOGLE_MAP_API_KEY
            }
        })
        return response.data.results[0].address_components.find(address => address.types.includes('administrative_area_level_1')).long_name
    }

    const formatLatAndLng = (lat, lng) => {
        return `${lat},${lng}`;
    };



    return {
        formatLatAndLng,
        getStateFromLatAndLng,
    };
};