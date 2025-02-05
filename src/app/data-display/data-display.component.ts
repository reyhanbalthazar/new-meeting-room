import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { interval, switchMap } from 'rxjs';

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
    // Fetch initial dataBookings
    this.fetchBookings();

    // Periodically update dataBookings every 30 seconds
    interval(10000)
      .pipe(switchMap(() => this.apiService.getDataBookings()))
      .subscribe(
        (response) => {
          console.log('Updated dataBookings:', response);
          this.dataBookings = response;
          this.filterBookingsByRoom({ name: this.selectedRoom || 'Semua Jadwal Ruangan Meeting' });
        },
        (error) => {
          console.error('Error updating dataBookings:', error);
        }
      );

    // Fetch dataRooms once on component initialization
    this.apiService.getDataRooms().subscribe(
      (response) => {
        this.dataRooms = response;
      },
      (error) => {
        console.error('Error fetching dataRooms:', error);
      }
    );
  }

  // Helper method for initial fetch
  private fetchBookings(): void {
    this.apiService.getDataBookings().subscribe(
      (response) => {
        console.log('Initial dataBookings:', response);
        this.dataBookings = response;
        this.filterBookingsByRoom({ name: 'Semua Jadwal Ruangan Meeting' }); // Show all bookings by default
      },
      (error) => {
        console.error('Error fetching initial dataBookings:', error);
      }
    );
  }


  formatTime(time: string): string {
    return time.slice(0, 5); // Get "HH:mm" by slicing the first 5 characters
  }

  // Method to filter bookings by room name
  filterBookingsByRoom(room: any): void {
    this.selectedRoom = room.name;
    console.log('selectedRoom : ' + this.selectedRoom);

    if (this.selectedRoom === 'Semua Jadwal Ruangan Meeting') {
      // Show all bookings if "Semua Jadwal Ruangan Meeting" is selected
      this.filteredBookings = this.dataBookings;
    } else {
      // Flatten and filter schedules by selected room
      // Process the nested structure (grouped by month and date)
      this.filteredBookings = this.dataBookings
        .map((monthGroup: any) => ({
          ...monthGroup,
          dates: monthGroup.dates
            .map((dateGroup: any) => ({
              ...dateGroup,
              schedules: dateGroup.schedules.filter((schedule: any) => schedule.room_id === room.id),
            }))
            .filter((dateGroup: any) => dateGroup.schedules.length > 0), // Only include dates with matching schedules
        }))
        .filter((monthGroup: any) => monthGroup.dates.length > 0); // Only include months with matching dates
    }
  }
}
