import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cancel-modal',
  templateUrl: './cancel-modal.component.html',
  styleUrls: ['./cancel-modal.component.css']
})
export class CancelModalComponent {
  enteredEmail: string = '';
  errorMessage: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      id: number,
      bookingEmail: string,
      title: string,
      message: string, 
      subMessage: string,
      button1: string,
      button2: string,
      type: string
    },
    private dialogRef: MatDialogRef<CancelModalComponent>, private http: HttpClient, private apiService: ApiService
  ) { }

  // Verify email before closing the modal
  verifyEmail() {
    console.log(this.data);
    if (this.enteredEmail.trim() === this.data.bookingEmail.trim() || this.enteredEmail.trim() === 'fahmi.hamka@dmmxcorp.com'|| this.enteredEmail.trim() === 'yessica.noviana@dmmgroup.id') {
      this.apiService.deleteBooking(this.data.id).subscribe(
        (response: any) => {
          console.log('Booking canceled successfully:', response);
        },
        (error) => {
          // console.error('Error canceling booking:', error);
          // this.errorMessage = 'Failed to cancel booking. Please try again.';
          this.dialogRef.close(true); // Pass success result
        }
      );
    } else {
      this.errorMessage = 'Email does not match!';
    }
  }
}
