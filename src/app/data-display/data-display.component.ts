import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  styleUrls: ['./data-display.component.css']
})
export class DataDisplayComponent implements OnInit {
  dataBookings: any;
  dataRooms: any;
  filteredBookings: any[] = [];
  selectedRoom: string | null = 'Semua Jadwal Ruangan Meeting'; // Default to "Semua Jadwal Ruangan Meeting"
  showMoreTabs: boolean = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Fetch data from the API Booking list
    this.apiService.getDataBookings().subscribe(
      (response) => {
        this.dataBookings = response;
        this.filterBookingsByRoom({ name: 'Semua Jadwal Ruangan Meeting' }); // Show all bookings by default
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );

    // Fetch data from the API Room list
    this.apiService.getDataRooms().subscribe(
      (response) => {
        this.dataRooms = response;
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  formatTime(time: string): string {
    return time.slice(0, 5); // Get "HH:mm" by slicing the first 5 characters
  }

  // Method to filter bookings by room name
  filterBookingsByRoom(room: any): void {
    this.selectedRoom = room.name;

    if (this.selectedRoom === 'Semua Jadwal Ruangan Meeting') {
      // Show all bookings if "Semua Jadwal Ruangan Meeting" is selected
      this.filteredBookings = this.dataBookings;
    } else {
      // Flatten and filter schedules by selected room
      this.filteredBookings = this.dataBookings
        .map((booking: any) => ({
          date: booking.date,
          schedules: booking.schedules.filter((schedule: any) => schedule.room === this.selectedRoom)
        }))
        .filter((booking: any) => booking.schedules.length > 0); // Keep only dates with matching schedules
    }
  }
}
