import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { interval, switchMap } from 'rxjs';
import { CancelModalComponent } from '../cancel-modal/cancel-modal.component';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  styleUrls: ['./data-display.component.css']
})
export class DataDisplayComponent implements OnInit {
  dataBookings: any;
  dataRooms: any;
  filteredBookings: any[] = [];
  selectedRoom: { id: number | null; name: string } = { id: null, name: 'Semua Jadwal Ruangan Meeting' };
  showMoreTabs: boolean = false;

  constructor(private apiService: ApiService, private dialog: MatDialog) { }

  ngOnInit(): void {
    // Fetch initial dataBookings
    this.fetchBookings();

    // Periodically update dataBookings every 30 seconds
    interval(10000)
      .pipe(switchMap(() => this.apiService.getDataBookings()))
      .subscribe(
        (bookings) => {
          console.log('Updated dataBookings:', bookings);
          this.dataBookings = bookings;
          this.filterBookingsByRoom({ id: this.selectedRoom.id || null, name: this.selectedRoom.name || 'Semua Jadwal Ruangan Meeting' });
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
      (bookings) => {
        console.log('Initial dataBookings:', bookings);
        this.dataBookings = bookings;
        this.filterBookingsByRoom({ name: 'Semua Jadwal Ruangan Meeting' }); // Show all bookings by default
      },
      (error) => {
        console.error('Error fetching initial dataBookings:', error);
      }
    );
  }

  formatTime(time: string): string {
    // Split by 'T' and take the time part, then split by ':' and take HH:mm
    return time.split('T')[1]?.split(':').slice(0, 2).join(':') || time;
  }

  // Method to filter bookings by room name
  filterBookingsByRoom(room: any): void {
    this.selectedRoom = room;
    console.log('selectedRoom name : ' + this.selectedRoom.name);
    console.log('selectedRoom id : ' + this.selectedRoom.id);

    if (this.selectedRoom.name === 'Semua Jadwal Ruangan Meeting') {
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

  // Open modal and pass selected booking data
  openVerificationModal(booking: any) {
    const dialogRef = this.dialog.open(CancelModalComponent, {
      width: '400px',
      data: {
        id: booking.id,
        bookingEmail: booking.email, // Pass the email from the selected booking
        title: 'Batalkan Meeting',
        message: 'Anda akan menghapus jadwal meeting yang telah Anda buat.',
        subMessage: 'Untuk melanjutkan, silahkan masukkan alamat email yang digunakan saat melakukan reservasi.',
        button1: 'Lanjutkan',
        button2: 'Kembali',
        type: 'confirmation',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Email verified successfully');
      } else {
        console.log('Verification cancelled');
      }
    });
  }
}
