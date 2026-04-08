import { Booking } from './booking.model';

export interface BookingResponse {
    statusCode: number;
    message?: string;
    data?: {
        bookings: Booking[];
    };
}