import {Between, LessThan, MoreThan, MoreThanOrEqual} from "typeorm";
import {format, addYears} from "date-fns";
const slugify = require("slugify");

const dayjs = require("dayjs");
dayjs().format();
const moment = require("moment");

export const BetweenDates = (from: Date | string, to: Date | string) =>
    Between(
        format(typeof from === "string" ? new Date(from) : from, "yyyy-MM-dd HH:MM:SS"),
        format(typeof to === "string" ? new Date(to) : to, "yyyy-MM-dd HH:MM:SS")
    );

export const UseFnDateFormat = (from: Date | string) =>
    format(typeof from === "string" ? new Date(from) : from, "yyyy-MM-dd");

export const AfterDate = (date: Date) => Between(date, addYears(date, 100));
export const MoreThanOrEqualsDate = (date: Date) => MoreThanOrEqual(format(date, 'yyyy-MM-dd HH:MM:SS'))
export const LessThanDate = (date: Date) => LessThan(format(date, 'yyyy-MM-dd HH:MM:SS'))

export const getDiffInMinutes = (dt2, dt1) => {
    // Calculate the difference in milliseconds between the two provided dates and convert it to seconds
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    // Convert the difference from seconds to minutes
    diff /= 60;
    // Return the absolute value of the rounded difference in minutes
    return Math.abs(Math.round(diff));
}

export const useRequestExpiryTime = () => {
    const date = new Date();
    return new Date(date.getTime() + 120000).toISOString().slice(0, 19).replace('T', ' ');
}

export const useMysqlDate = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export const useDayJs = () => {
    const formatter = (date?) => {
        return date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    }

    const formatter2 = (date?: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD HH:MM') : dayjs()
    }

    const addDays = (date: string, days: number) => {
        return dayjs(date).add(days, 'day')
    }

    const subtractDays = (date: string, days: number) => {
        return dayjs(date).subtract(days, 'day')
    }

    return {formatter, addDays, formatter2, subtractDays, useRequestExpiryTime}
}

export const getTotalPages = (totalRows: number, limit: number) => {
    return totalRows > 20 ? Math.round(totalRows / limit) : 1;
}

export const CURRENCIES = [
    {
        "symbol": "₦",
        "name": "Nigerian Naira",
        "symbol_native": "₦",
        "decimal_digits": 2,
        "rounding": 0,
        "code": "NGN",
        "name_plural": "Nigerian naira"
    },
    {
        "symbol": "$",
        "name": "US Dollar",
        "symbol_native": "$",
        "decimal_digits": 2,
        "rounding": 0,
        "code": "USD",
        "name_plural": "US dollars"
    }
]
export const SUPPORTED_COUNTRIES = {
    NIGERIA: {
        name: 'NIGERIA',
        symbol: "₦",
        code: "NGN",
    },
    USA: {
        name: 'United States',
        symbol: "$",
        code: "USD",
    }

}

export const dateToCron = (date) => {
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    return `${seconds} ${minutes} ${hours} ${days} ${months} ${dayOfWeek}`;
};


export const subtractMinutesFromDate = (date, min) => {
    date.setMinutes(date.getMinutes() - min);
    return date;
};


export const todaysDate = () => moment().format("YYYY-MM-DD");

export const roundPosition = (n, pos) => {
    const base = Math.pow(10, pos);
    return Math.round(n / base) * base;
};

export const jwtConstant = {
    secret: "Ben124"
};

export const generateRandomNum = () => {
    const min = 1000;
    const max = 9999;
    return Math.floor(Math
        .random() * (max - min + 1)) + min;
}

export const generateTrackingCode = () => {
    const min = 10000000;
    const max = 99990000;
    return Math.floor(Math
        .random() * (max - min + 1)) + min;
}

export const getPaystackFee = (amount): { applicable_fee: number, paystack_amount: number } => {
    const decimal_fee = 1.5 / 100;
    const applicableFee = decimal_fee * amount;
    let paystack_amount = 0;
    applicableFee > 2000 ? paystack_amount = amount + 2000 : paystack_amount = amount / (1 - decimal_fee) + 0.01;
    return {applicable_fee: applicableFee > 2000 ? 2000 : applicableFee, paystack_amount};
};
export const start = new Date().setUTCHours(0, 0, 0, 0);
export const end = moment().format("YYYY-MM-DD 23:59:59");

export const formatDate = (date_string?) => {
    return date_string ? moment(date_string).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
};

export const formatDateTime = (date: string) => format(new Date(date), "yyyy-MM-dd HH:MM:SS");


export const isNull = (value) => [undefined, null, 'null'].includes(value)

export const DAYS_OF_THE_WEEK = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6
}


export function useSlugify(string) {
    return slugify(string, {
        replacement: "-",  // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true,      // convert to lower case, defaults to `false`
        strict: false,     // strip special characters except replacement, defaults to `false`
        locale: "vi",       // language code of the locale to use
        trim: true         // trim leading and trailing replacement chars, defaults to `true`
    });
}



