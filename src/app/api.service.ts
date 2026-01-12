import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Booking, BookingGroup } from './models/booking.model';
import { BookingResponse } from './models/booking-response.model';
import { Room } from './models/room.model';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  private apiUrlBookings = environment.apiUrl + '/bookings';
  private apiUrlRooms = environment.apiUrl + '/rooms';

  constructor(private http: HttpClient) { }

  getDataBookings(): Observable<BookingGroup[]> {
    return this.http.get<BookingResponse>(this.apiUrlBookings).pipe(
      map(response => {
        const bookings = response.data?.bookings || [];

        // Group bookings by month and date
        const groupedBookings: BookingGroup[] = [];

        // Group by month first
        const bookingsByMonth: { [key: string]: Booking[] } = {};

        bookings.forEach((booking: Booking) => {
          // Extract date from the booking (assuming it's in ISO format)
          const bookingDate = new Date(booking.date);
          const monthYear = `${bookingDate.toLocaleString('default', { month: 'long' })} ${bookingDate.getFullYear()}`;

          if (!bookingsByMonth[monthYear]) {
            bookingsByMonth[monthYear] = [];
          }

          bookingsByMonth[monthYear].push(booking);
        });

        // For each month, group by date
        Object.keys(bookingsByMonth).forEach(monthKey => {
          const monthBookings = bookingsByMonth[monthKey];

          // Group by date within the month
          const bookingsByDate: { [key: string]: Booking[] } = {};

          monthBookings.forEach((booking: Booking) => {
            // Extract date part from the booking.date field (which is in ISO format with timezone)
            // The date field looks like "2026-01-08T00:00:00+07:00", so we extract just the date part
            const dateStr = booking.date.split('T')[0];

            if (!bookingsByDate[dateStr]) {
              bookingsByDate[dateStr] = [];
            }

            bookingsByDate[dateStr].push(booking);
          });

          // Create the month group structure
          const monthGroup: BookingGroup = {
            month: monthKey,
            dates: Object.keys(bookingsByDate).map(dateKey => ({
              date: dateKey,
              schedules: bookingsByDate[dateKey]
            }))
          };

          groupedBookings.push(monthGroup);
        });

        return groupedBookings;
      })
    );
  }

  getDataBookingsByRoomId(roomId: number): Observable<Booking[]> {
    return this.http.get<BookingResponse>(`${this.apiUrlBookings}?room_id=${roomId}`).pipe(
      map(response => response.data?.bookings || [])
    );
  }

  getDataRooms(): Observable<Room[]> {
    return this.http.get<any>(this.apiUrlRooms).pipe(
      map(response => {
        // Handle response with nested data.rooms structure
        if (response && response.data && Array.isArray(response.data.rooms)) {
          return response.data.rooms as Room[];
        } else if (Array.isArray(response)) {
          return response as Room[];
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data as Room[];
        } else {
          console.warn('Unexpected response format for rooms:', response);
          return [];
        }
      })
    );
  }

  createBooking(bookingData: any): Observable<any> {
    return this.http.post<any>(this.apiUrlBookings, bookingData);
  }

  deleteBooking(bookingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrlBookings}/${bookingId}`);
  }

}
