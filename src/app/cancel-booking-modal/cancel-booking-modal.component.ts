import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-cancel-booking-modal',
  templateUrl: './cancel-booking-modal.component.html',
  styleUrls: ['./cancel-booking-modal.component.css']
})
export class CancelBookingModalComponent {
  enteredEmail: string = '';
  errorMessage: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      bookingId: number,
      bookingEmail: string,
      title: string,
      message: string,
      subMessage: string,
      button1: string,
      button2: string,
      type: string
    },
    private dialogRef: MatDialogRef<CancelBookingModalComponent>,
    private apiService: ApiService
  ) { }

  // Verify email before canceling the booking
  verifyEmailAndCancel() {
    if (this.enteredEmail.trim() === this.data.bookingEmail.trim()) {
      // Call the API to cancel the booking
      this.apiService.deleteBooking(this.data.bookingId).subscribe({
        next: (response) => {
          console.log('Booking cancelled successfully:', response);
          this.dialogRef.close(true); // Close with success result
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.errorMessage = 'Failed to cancel booking. Please try again.';
        }
      });
    } else {
      this.errorMessage = 'Email does not match!';
    }
  }

  // Cancel the operation
  cancel() {
    this.dialogRef.close(false);
  }
}