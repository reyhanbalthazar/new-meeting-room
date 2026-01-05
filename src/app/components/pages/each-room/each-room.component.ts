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
    // Fetch rooms once on initialization
    this.fetchRooms();

    // Check if a room ID is passed in the route
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.selectedRoom = Number(roomId);

      // Wait until dataRooms is fetched
      const intervalId = setInterval(() => {
        if (this.dataRooms && this.dataRooms.length > 0) {
          this.setRoomName(roomId); // Fetch the room name based on roomId
          clearInterval(intervalId); // Stop polling
        }
      }, 100);
    }

    // Fetch initial bookings and start periodic updates
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
    if (!this.dataRooms || this.dataRooms.length === 0) {
      console.error('Rooms data is not yet loaded.');
      this.selectedRoomName = 'Room not found';
      return;
    }

    const room = this.dataRooms.find((room) => room.id == roomId); // Match roomId with the correct field in dataRooms
    if (room) {
      this.selectedRoomName = room.name; // Set the selected room name
      console.log('Selected Room Name:', this.selectedRoomName);
    } else {
      this.selectedRoomName = 'Room not found'; // Default if room not found
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
          .map((dateGroup: any) => ({
            ...dateGroup,
            schedules: dateGroup.schedules.filter((schedule: any) =>
              schedule.room_id === roomId
            ),
          }))
          .filter((dateGroup: any) => {
            // Only include dates that match the selected date
            return dateGroup.date === selectedDateString && dateGroup.schedules.length > 0;
          }),
      }))
      .filter((monthGroup) => monthGroup.dates.length > 0); // Only include months with matching dates

    // Log the result
    console.log('Filtered bookings:', this.filteredBookings);
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

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
}