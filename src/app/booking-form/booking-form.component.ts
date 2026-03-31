import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BookingResponse } from '../models/booking-response.model';
import { Room } from '../models/room.model';
import { MeetingCategory } from '../models/booking.model';
// Modal
import { MatDialog } from '@angular/material/dialog';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent {
  isOpen = false; // Track the dropdown state
  rooms: Room[] = []; // Array to hold the fetched room data
  selectedRoomName = 'Pilih Ruangan'; // Default button text
  meetingCategories = Object.values(MeetingCategory);
  initialRoomId: number | null = null;
  bookingData = {
    room_id: 0, // Changed from string to number
    user_id: 1,
    date: '',
    start_time: '',
    end_time: '',
    pic: '',
    email: '',
    topic: '',
    meeting_category: '' as MeetingCategory | '',
    participants: [] as { name: string; email: string }[]
  }

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const roomIdParam = this.route.snapshot.queryParamMap.get('roomId');
    const parsedRoomId = roomIdParam ? Number(roomIdParam) : NaN;
    this.initialRoomId = Number.isNaN(parsedRoomId) ? null : parsedRoomId;

    this.fetchRooms();
    // Initialize participants array
    this.bookingData.participants = [];
  }

  fetchRooms(): void {
    this.apiService.getDataRooms().subscribe(
      (response) => {
        // Filter out room with ID 1 (possibly reserved or unavailable)
        this.rooms = response.filter((room: Room) => room.id !== 1);
        this.applyInitialRoomSelection();
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    )
  }

  private applyInitialRoomSelection(): void {
    if (!this.initialRoomId || !Array.isArray(this.rooms)) {
      return;
    }

    const roomFromQuery = this.rooms.find((room: Room) => room.id === this.initialRoomId);
    if (roomFromQuery) {
      this.selectRoom(roomFromQuery);
    }
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  selectRoom(room: Room) {
    this.bookingData.room_id = room.id; // This is already a number
    this.selectedRoomName = room.name; // Update the button text
    this.isOpen = false; // Close the dropdown
  }

  onDateChange(event: any) {
    const formattedDate = this.formatDateInput(event?.value);
    this.bookingData.date = formattedDate;

    console.log(this.bookingData);
  }

  private formatDateInput(dateValue: unknown): string {
    if (!dateValue) {
      return '';
    }

    const selectedDate = dateValue instanceof Date ? dateValue : new Date(String(dateValue));

    if (Number.isNaN(selectedDate.getTime())) {
      return '';
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Helper method to validate bookingData
  isBookingDataValid(): boolean {
    // Check if all required fields are filled
    const basicFieldsValid = this.bookingData.room_id !== 0 &&
      this.bookingData.date !== '' &&
      this.bookingData.start_time !== '' &&
      this.bookingData.end_time !== '' &&
      this.bookingData.pic !== '' &&
      this.bookingData.topic !== '' &&
      this.bookingData.meeting_category !== '';

    // Validate participants if there are any
    let participantsValid = true;
    if (this.bookingData.participants.length > 0) {
      participantsValid = this.bookingData.participants.every(attendee =>
        attendee.name.trim() !== '' && attendee.email.trim() !== ''
      );
    }

    return basicFieldsValid && participantsValid;
  }

  onSubmit() {
    if (!this.isBookingDataValid()) {
      this.openInvalidFormModal();
      return; // Exit the function early if validation fails
    }

    const normalizedDate = this.formatDateInput(this.bookingData.date);
    if (!normalizedDate) {
      this.openInvalidFormModal();
      return;
    }

    // Open confirmation modal before proceeding
    this.openConfirmationModal().afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        const { meeting_category, ...bookingFormData } = this.bookingData;

        // Format the date and time in ISO format as expected by the API
        const bookingPayload = {
          ...bookingFormData,
          // Ensure room_id is a number and format date and time in ISO format: YYYY-MM-DDTHH:mm:ssZ
          room_id: Number(this.bookingData.room_id),
          date: `${normalizedDate}T00:00:00Z`,
          start_time: `${normalizedDate}T${this.bookingData.start_time}:00Z`,
          end_time: `${normalizedDate}T${this.bookingData.end_time}:00Z`,
          category: meeting_category,
          participants: this.bookingData.participants // Include participants in the payload
        };

        // Log the data being sent to the backend
        console.log('Sending booking data to backend:', bookingPayload);

        // Proceed with booking if user confirmed
        this.apiService.createBooking(bookingPayload)
          .subscribe(
            (response) => {
              // The API returns the created booking in the 'data' property
              if (response && response.data) {
                this.openSuccessModal(response.data);
              } else {
                // Fallback - use the original booking data
                this.openSuccessModal(bookingPayload);
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
  openSuccessModal(bookingData?: any) {
    // Use the response data if available, otherwise fallback to form data
    let roomName = this.selectedRoomName; // Default to selected room name
    if (bookingData && bookingData.room_id) {
      // Try to find the room name from the rooms array, fallback to using the room_id
      const foundRoom = this.rooms.find(r => r.id === bookingData.room_id);
      roomName = foundRoom ? foundRoom.name : `Room ${bookingData.room_id}`;
    }

    const date = bookingData ? new Date(bookingData.date).toISOString().split('T')[0] : this.bookingData.date;
    const startTime = bookingData ? new Date(bookingData.start_time).toTimeString().substring(0, 5) : this.bookingData.start_time;
    const endTime = bookingData ? new Date(bookingData.end_time).toTimeString().substring(0, 5) : this.bookingData.end_time;

    this.dialog.open(BookingModalComponent, {
      data: {
        type: 'success',
        title: 'Reservasi Berhasil',
        message: 'Reservasi untuk ruangan ' + roomName + ' pada ' + date + ' dari ' + startTime + ' hingga ' + endTime + ' telah berhasil.',
        subMessage: 'Mohon segera berikan informasi reservasi ini kepada resepsionis untuk konfirmasi ruangan. Terima kasih',
        button1: 'Selesai',
        btnWaMe: 'Konfirmasi',
        roomName: roomName,
        startTime: startTime,
        endTime: endTime
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

      // Add 1 hour to the start time
      let endHours = hours + 1;

      // Ensure hours stay within a 24-hour format
      if (endHours >= 24) {
        endHours -= 24;
      }

      // Format the time back to HH:mm
      this.bookingData.end_time = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  addAttendee(): void {
    this.bookingData.participants.push({ name: '', email: '' });
  }

  removeAttendee(index: number): void {
    this.bookingData.participants.splice(index, 1);
  }

  getTimePart(): string {
    const now = new Date();
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    return now.toLocaleTimeString('en-US', timeOptions);
  }

  getDayPart(): string {
    const now = new Date();
    const dayOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long'
    };

    return now.toLocaleDateString('en-US', dayOptions);
  }

  getDatePart(): string {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return now.toLocaleDateString('en-US', dateOptions);
  }
}
