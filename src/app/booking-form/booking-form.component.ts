import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BookingResponse } from '../models/booking-response.model';
// Modal
import { MatDialog } from '@angular/material/dialog';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';


@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent {
  isOpen = false; // Track the dropdown state
  rooms: any[] = []; // Array to hold the fetched room data
  selectedRoomName = 'Pilih Ruangan'; // Default button text
  bookingData = {
    room_id: '',
    user_id: 1,
    date: '',
    start_time: '',
    end_time: '',
    pic: '',
    email: '',
    topic: '',
  }

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.fetchRooms();
  }

  fetchRooms(): void {
    this.apiService.getDataRooms().subscribe(
      (response) => {
        this.rooms = response.filter((room: any) => room.id !== 1);
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    )
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  selectRoom(room: any) {
    this.bookingData.room_id = room.id;
    this.selectedRoomName = room.name; // Update the button text
    this.isOpen = false; // Close the dropdown
  }

  onDateChange(event: any) {
    const selectedDate = new Date(event.value);

    // Get the local date components
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(selectedDate.getDate()).padStart(2, '0');

    // Format the date as YYYY-MM-DD
    this.bookingData.date = `${year}-${month}-${day}`;

    console.log(this.bookingData);
  }

  // Helper method to validate bookingData
  isBookingDataValid(): boolean {
    return this.bookingData.room_id !== '' &&
      this.bookingData.date !== '' &&
      this.bookingData.start_time !== '' &&
      this.bookingData.end_time !== '' &&
      this.bookingData.pic !== '' &&
      this.bookingData.topic !== ''; // Adjust as needed based on required fields
  }

  onSubmit() {
    if (!this.isBookingDataValid()) {
      this.openInvalidFormModal();
      return; // Exit the function early if validation fails
    }
    // Open confirmation modal before proceeding
    this.openConfirmationModal().afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Proceed with booking if user confirmed
        this.http.post<BookingResponse>(environment.apiUrl + '/bookings', this.bookingData)
          .subscribe(
            (response) => {
              if (response.statusCode === 201) {
                this.openSuccessModal();
              }
            },
            (error) => {
              console.error('Booking failed:', error);
              if (error.status === 409) {
                this.openConflictModal();
              } else {
                this.openErrorModal('An unexpected error occurred. Please try again.');
              }
            }
          );
      }
    });
  }



  // Confirmation modal
  openConfirmationModal() {
    return this.dialog.open(BookingModalComponent, {
      data: {
        type: 'confirmation',
        title: 'Konfirmasi Booking',
        message: 'Pastikan data yang kamu masukan sudah benar',
        subMessage: 'Klik lanjutkan untuk menyelesaikan booking',
        button1: 'Lanjutkan',
        button2: 'Periksa Lagi'
      },
      width: '300px'
    });
  }

  // Success modal
  openSuccessModal() {
    this.dialog.open(BookingModalComponent, {
      data: {
        type: 'success',
        title: 'Reservasi Berhasil',
        message: 'Reservasi untuk ruangan ' + this.selectedRoomName + ' pada ' + this.bookingData.date + ' dari ' + this.bookingData.start_time + ' hingga ' + this.bookingData.end_time + ' telah berhasil.',
        subMessage: 'Mohon segera berikan informasi reservasi ini kepada resepsionis untuk konfirmasi ruangan. Terima kasih',
        button1: 'Selesai',
        btnWaMe: 'Konfirmasi',
        roomName: this.selectedRoomName,
        startTime: this.bookingData.start_time,
        endTime: this.bookingData.end_time
      },
      width: '300px'
    });
  }

  // Conflict modal for date/hour conflicts
  openConflictModal() {
    this.dialog.open(BookingModalComponent, {
      data: {
        type: 'conflict',
        title: 'Ruangan Tidak Tersedia',
        message: 'Silahkan pilih ruangan atau waktu lain yang tersedia',
        button1: 'Jadwalkan Ulang'
      },
      width: '300px'
    });
  }

  openInvalidFormModal() {
    this.dialog.open(BookingModalComponent, {
      data: {
        type: 'invalidForm',
        title: 'Pastikan semua kolom terisi',
        message: '',
        button1: 'Coba Lagi'
      },
      width: '300px'
    });
  }

  // Generic error modal for other errors
  openErrorModal(errorMessage: string) {
    this.dialog.open(BookingModalComponent, {
      data: {
        type: 'error',
        title: 'Error',
        message: 'Internal Server Error',
      },
      width: '300px'
    });
  }

  updateEndTime(): void {
    if (this.bookingData.start_time) {
      // Parse the start time into hours and minutes
      const [hours, minutes] = this.bookingData.start_time.split(':').map(Number);

      // Add 1 hour and 30 minutes to the start time
      let endHours = hours + 1;
      let endMinutes = minutes + 30;

      if (endMinutes >= 60) {
        endMinutes -= 60;
        endHours += 1;
      }

      // Ensure hours stay within a 24-hour format
      if (endHours >= 24) {
        endHours -= 24;
      }

      // Format the time back to HH:mm
      this.bookingData.end_time = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
  }



}
