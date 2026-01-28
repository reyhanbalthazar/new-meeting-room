import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../api.service';
import { Booking } from '../../../models/booking.model'; // Import the shared Booking interface
import { interval, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

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
  isAdsEnable: boolean = false;
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
    private router: Router,
    private dialog: MatDialog
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
        // Filter by selected date
        const selectedDateString = this.formatDate(this.selectedDate);
        this.filteredBookings = this.dataBookings.filter(booking => {
          // Extract date from the booking's date field
          const bookingDate = new Date(booking.date);
          const bookingDateString = this.formatDate(bookingDate);

          // Compare the dates
          // return bookingDateString === selectedDateString; // current date
          return bookingDate; // all date
        });
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
          // Filter by selected date
          const selectedDateString = this.formatDate(this.selectedDate);
          this.filteredBookings = this.dataBookings.filter(booking => {
            // Extract date from the booking's date field
            const bookingDate = new Date(booking.date);
            const bookingDateString = this.formatDate(bookingDate);

            // Compare the dates
            // return bookingDateString === selectedDateString; // current date
            return bookingDate; // all date
          });
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
    const selectedDateString = this.formatDate(this.selectedDate);
    this.filteredBookings = this.dataBookings.filter(booking => {
      // Extract date from the booking's date field
      const bookingDate = new Date(booking.date);
      const bookingDateString = this.formatDate(bookingDate);

      // Compare the dates
      return bookingDateString === selectedDateString;
    });
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
   * Format date as YYYY-MM-DD string
   */
  formatDate(date: Date): string {
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

  /**
   * Add participant to a booking
   */
  addParticipantToBooking(booking: Booking): void {
    console.log('Add participant to booking:', booking);
    // For now, we'll just show a simple prompt to get participant details
    // In a real implementation, you would open a modal with a form

    const participantName = prompt('Enter participant name:');
    if (!participantName) {
      return; // User cancelled
    }

    const participantEmail = prompt('Enter participant email:');
    if (!participantEmail) {
      return; // User cancelled
    }

    // In a real implementation, you would call an API to add participant to the booking
    // Since there's no specific API method for adding participants, we'll just show a message
    alert(`In a real implementation, we would add ${participantName} (${participantEmail}) to booking: ${booking.topic}`);

    console.log('Would add participant to booking:', { name: participantName, email: participantEmail, bookingId: booking.id });
  }

  /**
   * Cancel a booking
   */
  cancelBooking(booking: Booking): void {
    console.log('Cancel booking:', booking);

    if (confirm(`Are you sure you want to cancel the booking "${booking.topic}"?`)) {
      this.apiService.deleteBooking(booking.id).subscribe({
        next: (response) => {
          console.log('Booking cancelled successfully:', response);
          // Refresh the bookings list
          this.fetchBookings();
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          alert('Failed to cancel booking. Please try again.');
        }
      });
    }
  }
}