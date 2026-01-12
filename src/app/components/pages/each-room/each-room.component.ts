import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../api.service';
import { interval, Observable, Subject, switchMap, takeUntil } from 'rxjs';

interface Booking {
  start_time: string;
  end_time: string;
  topic: string;
  pic: string;
  date: string; // Date field for the booking
  [key: string]: any; // For any additional properties
}

interface DateFormatOptions {
  time: Intl.DateTimeFormatOptions;
  day: Intl.DateTimeFormatOptions;
  date: Intl.DateTimeFormatOptions;
}

@Component({
  selector: 'app-each-room',
  templateUrl: './each-room.component.html',
  styleUrls: ['./each-room.component.css'],
})
export class EachRoomComponent implements OnInit, OnDestroy {
  // Data
  dataBookings: Booking[] = [];
  filteredBookings: Booking[] = []; // Bookings filtered by selected date

  // State
  selectedRoom: number | null = null;
  selectedRoomName: string = '';
  isAdsEnable: boolean = true;
  selectedDate: Date = new Date();
  useTouchUi: boolean = false;
  selectedBooking: Booking | null = null;

  // Configuration
  private readonly UPDATE_INTERVAL_MS = 10000;
  private readonly destroy$ = new Subject<void>();

  // Date formatting options
  private readonly dateFormatOptions: DateFormatOptions = {
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    day: { weekday: 'long' },
    date: { year: 'numeric', month: 'long', day: 'numeric' }
  };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component state and start data fetching
   */
  private initializeComponent(): void {
    this.initializeRoomFromRoute();
    this.initializeTouchUi();
    this.fetchBookings();
    this.setupPeriodicUpdates();
  }

  /**
   * Get room ID from route parameters
   */
  private initializeRoomFromRoute(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    this.selectedRoom = roomId ? Number(roomId) : null;
  }

  /**
   * Determine if touch UI should be used based on screen size
   */
  private initializeTouchUi(): void {
    this.useTouchUi = window.innerWidth < 768 || window.innerHeight > window.innerWidth;
  }

  /**
   * Fetch bookings for the selected room
   */
  fetchBookings(): void {
    if (!this.selectedRoom) {
      return;
    }

    this.apiService.getDataBookingsByRoomId(this.selectedRoom).subscribe({
      next: (bookings: Booking[]) => {
        this.dataBookings = bookings;
        this.filterBookingsByDate(); // Filter by selected date
        console.debug('Fetched bookings for room:', bookings);
      },
      error: (error) => {
        console.error('Error fetching bookings:', error);
        this.dataBookings = []; // Clear data on error
        this.filteredBookings = []; // Also clear filtered bookings
      }
    });
  }

  /**
   * Set up periodic updates for bookings
   */
  private setupPeriodicUpdates(): void {
    interval(this.UPDATE_INTERVAL_MS)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.getUpdatedBookings())
      )
      .subscribe({
        next: (bookings: Booking[]) => {
          this.dataBookings = bookings;
          this.filterBookingsByDate(); // Filter by selected date
          console.debug('Updated bookings:', bookings);
        },
        error: (error) => {
          console.error('Error during periodic updates:', error);
        }
      });
  }

  /**
   * Get updated bookings observable
   */
  private getUpdatedBookings(): Observable<Booking[]> {
    if (!this.selectedRoom) {
      return new Observable<Booking[]>(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.apiService.getDataBookingsByRoomId(this.selectedRoom);
  }

  /**
   * Format time string from ISO datetime
   */
  formatTime(dateTimeString: string): string {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('en-US', this.dateFormatOptions.time);
    } catch (error) {
      console.error('Error formatting time:', error);
      return dateTimeString; // Fallback to original string
    }
  }

  /**
   * Open verification modal with booking details
   */
  openVerificationModal(booking: Booking): void {
    this.selectedBooking = booking;
    console.debug('Selected booking for verification:', booking);
  }

  /**
   * Handle date picker change
   */
  onDateChange(event: any): void {
    if (!event.value) {
      return;
    }

    this.selectedDate = event.value;

    // Filter existing bookings by the new selected date
    this.filterBookingsByDate();
  }

  /**
   * Get formatted time part from selected date
   */
  getTimePart(): string {
    return this.selectedDate.toLocaleTimeString('en-US', this.dateFormatOptions.time);
  }

  /**
   * Get formatted day part from selected date
   */
  getDayPart(): string {
    return this.selectedDate.toLocaleDateString('en-US', this.dateFormatOptions.day);
  }

  /**
   * Get formatted date part from selected date
   */
  getDatePart(): string {
    return this.selectedDate.toLocaleDateString('en-US', this.dateFormatOptions.date);
  }

  /**
   * Get complete formatted date-time string
   */
  getFormattedDateTime(): string {
    return `${this.getDayPart()}, ${this.getDatePart()} ${this.getTimePart()}`;
  }

  /**
   * Navigate to booking form
   */
  navigateToBookingForm(): void {
    if (!this.selectedRoom) {
      console.warn('No room selected for booking');
      return;
    }

    this.router.navigate(['/form-booking'], {
      queryParams: { roomId: this.selectedRoom }
    });
  }

  /**
   * Clear selected booking and go back to room description
   */
  goBackToRoomDescription(): void {
    this.selectedBooking = null;
  }

  /**
   * Get total number of scheduled bookings
   */
  getTotalScheduleCount(): number {
    return this.filteredBookings.length;
  }

  /**
   * Filter bookings by the selected date
   */
  private filterBookingsByDate(): void {
    const selectedDateString = this.formatDate(this.selectedDate);

    this.filteredBookings = this.dataBookings.filter(booking => {
      // Extract date from the booking's date field
      const bookingDate = new Date(booking.date);
      const bookingDateString = this.formatDate(bookingDate);

      // Compare the dates
      return bookingDateString === selectedDateString;
    });

    console.debug(`Filtered bookings for date ${selectedDateString}:`, this.filteredBookings);
  }

  /**
   * Format date as YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if there are any bookings
   */
  get hasBookings(): boolean {
    return this.filteredBookings.length > 0;
  }
}