import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../api.service';
import { interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-each-room',
  templateUrl: './each-room.component.html',
  styleUrls: ['./each-room.component.css'],
})
export class EachRoomComponent implements OnInit {
  dataRooms: any[] = []; // Holds room data
  dataBookings: any[] = []; // Holds all bookings (grouped by month and date)
  filteredBookings: any[] = []; // Filtered bookings for the selected room
  selectedRoom: number | null = null; // Currently selected room ID
  selectedRoomName: string = ''; // Selected room name
  isAdsEnable: boolean = true; // Variable to toggle ads visibility (will be from API later)
  selectedDate: Date = new Date(); // Default to current date

  constructor(private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Check if a room ID is passed in the route
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.selectedRoom = Number(roomId);
      this.setRoomName(roomId); // Set room name immediately, we'll update when rooms are fetched
    }

    // Fetch rooms and bookings
    this.fetchRooms();
    this.fetchBookings(); // Initial fetch
    this.setupPeriodicUpdates(); // Start periodic updates
  }

  fetchRooms(): void {
    this.apiService.getDataRooms().subscribe(
      (rooms) => {
        this.dataRooms = rooms;
      },
      (error) => {
        console.error('Error fetching rooms:', error);
      }
    );
  }

  fetchBookings(): void {
    this.apiService.getDataBookings().subscribe(
      (bookings) => {
        this.dataBookings = bookings;
        console.log('Fetched bookings:', bookings);
        if (this.selectedRoom) {
          this.filterBookingsByRoomId(this.selectedRoom);
        }
      },
      (error) => {
        console.error('Error fetching bookings:', error);
      }
    );
  }

  setupPeriodicUpdates(): void {
    interval(10000) // Update every 10 seconds
      .pipe(switchMap(() => this.apiService.getDataBookings()))
      .subscribe(
        (bookings) => {
          console.log('Updated bookings:', bookings);
          this.dataBookings = bookings;
          if (this.selectedRoom) {
            this.filterBookingsByRoomId(this.selectedRoom);
          }
        },
        (error) => {
          console.error('Error during periodic updates:', error);
        }
      );
  }

  setRoomName(roomId: string): void {
    // Initially set a temporary name while waiting for rooms to load
    this.selectedRoomName = `Room ${roomId}`;

    // Check if rooms are already loaded
    if (this.dataRooms && this.dataRooms.length > 0) {
      this.updateRoomName(roomId);
    } else {
      // Wait for rooms to load with a timeout
      const startTime = Date.now();
      const checkRooms = () => {
        if (this.dataRooms && this.dataRooms.length > 0) {
          this.updateRoomName(roomId);
        } else if (Date.now() - startTime < 5000) { // 5 second timeout
          setTimeout(checkRooms, 100);
        }
      };
      checkRooms();
    }
  }

  private updateRoomName(roomId: string): void {
    const room = this.dataRooms.find((room) => room.id == Number(roomId));
    if (room) {
      this.selectedRoomName = room.name;
      console.log('Selected Room Name:', this.selectedRoomName);
    } else {
      this.selectedRoomName = `Room ${roomId} (not found)`;
      console.log('Selected Room Name:', this.selectedRoomName);
    }
  }

  filterBookingsByRoomId(roomId: number | null): void {
    if (roomId === null || isNaN(roomId)) {
      this.filteredBookings = []; // Reset filteredBookings if no valid room ID is provided
      console.warn('Invalid roomId:', roomId); // Debug log
      return;
    }

    // Format the selected date to match the date format in the data
    const selectedDateString = this.formatDate(this.selectedDate);

    // Process the nested structure (grouped by month and date)
    this.filteredBookings = this.dataBookings
      .map((monthGroup) => ({
        ...monthGroup,
        dates: monthGroup.dates
          .map((dateGroup: any) => {
            // Filter schedules by room_id
            const filteredSchedules = dateGroup.schedules.filter((schedule: any) =>
              schedule.room_id === roomId
            );

            return {
              ...dateGroup,
              schedules: filteredSchedules
            };
          })
          .filter((dateGroup: any) => {
            // Only include dates that match the selected date AND have schedules after filtering
            return dateGroup.date === selectedDateString && dateGroup.schedules.length > 0;
          }),
      }))
      .filter((monthGroup) => monthGroup.dates.length > 0); // Only include months with matching dates

    // Log the result
    console.log('Filtered bookings:', this.filteredBookings);
    console.log('Selected date string:', selectedDateString);
    console.log('All data bookings:', this.dataBookings);
  }

  // filterBookingsByRoomId(roomId: number | null, targetDate?: string): void {
  //   if (roomId === null || isNaN(roomId)) {
  //     this.filteredBookings = [];
  //     console.warn('Invalid roomId:', roomId);
  //     return;
  //   }

  //   // Use provided date or default to today
  //   const filterDate = targetDate || new Datje().toISOString().split('T')[0];

  //   // Process the nested structure
  //   this.filteredBookings = this.dataBookings
  //     .map((monthGroup) => ({
  //       ...monthGroup,
  //       dates: monthGroup.dates
  //         .map((dateGroup: any) => ({
  //           ...dateGroup,
  //           schedules: dateGroup.schedules.filter((schedule: any) =>
  //             schedule.room_id === roomId
  //           ),
  //         }))
  //         .filter((dateGroup: any) =>
  //           dateGroup.schedules.length > 0 && dateGroup.date === filterDate
  //         ),
  //     }))
  //     .filter((monthGroup) => monthGroup.dates.length > 0);

  //   console.log('Filtered bookings:', this.filteredBookings);
  // }

  formatTime(dateTimeString: string): string {
    // The API returns datetime strings, so we need to extract time from them
    const date = new Date(dateTimeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  openVerificationModal(booking: any) {
    // Placeholder implementation - in a real app, this would open a modal
    console.log('Opening verification modal for booking:', booking);
    // In a real implementation, you would open a modal dialog here
  }

  getTotalScheduleCount(): number {
    return this.filteredBookings.reduce((total, monthGroup) => {
      return total + monthGroup.dates.reduce((dateTotal: number, dateGroup: any) => {
        return dateTotal + dateGroup.schedules.length;
      }, 0);
    }, 0);
  }

  formatDate(date: Date): string {
    // Format date as YYYY-MM-DD to match the expected format in the data
    // Using toISOString to ensure consistent date formatting regardless of timezone
    return date.toISOString().split('T')[0];
  }

  onDateChange(event: any): void {
    // Handle Material datepicker change
    if (event.value) {
      this.selectedDate = event.value;
    }

    if (this.selectedRoom) {
      this.filterBookingsByRoomId(this.selectedRoom);
    }
  }

  getTimePart(): string {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    return this.selectedDate.toLocaleTimeString('en-US', timeOptions);
  }

  getDayPart(): string {
    const dayOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long'
    };

    return this.selectedDate.toLocaleDateString('en-US', dayOptions);
  }

  getDatePart(): string {
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return this.selectedDate.toLocaleDateString('en-US', dateOptions);
  }

  // Optional: Keep the original method if you still need it elsewhere
  getFormattedDateTime(): string {
    return `${this.getDayPart()}, ${this.getDatePart()} ${this.getTimePart()}`;
  }
}