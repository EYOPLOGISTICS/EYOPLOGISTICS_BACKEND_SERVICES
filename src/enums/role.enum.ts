export enum Role {
    ADMIN = 'admin',
    VENDOR = 'vendor',
    USER = 'user',
}




export enum VERIFICATION_STATUS {
    FAILED = 'failed',
    VERIFIED = 'verified',
    VERIFYING = 'verifying',
    NEW = 'new',
    PENDING = 'pending',
}

export enum INSPECTION_SCORE_TYPE {
    APPROVE = 'approve',
    REPEAT = 'repeat',
}

export enum RIDE_TYPES {
    OSR_CRUISE = 'osr_cruise',
    LUXURY = 'luxury',
    OSR_BOLT = 'bolt'
}

export enum TRIP_TYPE {
    DELIVERY = 'delivery',
    RIDE_HAILING = 'ride_hailing',
}
