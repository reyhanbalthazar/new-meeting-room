import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-add-participant-modal',
  templateUrl: './add-participant-modal.component.html',
  styleUrls: ['./add-participant-modal.component.css']
})
export class AddParticipantModalComponent {
  enteredEmail: string = '';
  errorMessage: string = '';
  showParticipantForm: boolean = false; // Start with email confirmation
  isLoading: boolean = false; // Loading state for participants
  bookingForm: FormGroup;
  currentBooking: any;

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
    private dialogRef: MatDialogRef<AddParticipantModalComponent>,
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    // Initialize the form with an empty participants array
    this.bookingForm = this.fb.group({
      participants: this.fb.array([])
    });
  }

  // Getter for participants form array
  get participants() {
    return this.bookingForm.get('participants') as FormArray;
  }

  // Initialize the form with existing participants after email verification
  loadBookingWithParticipants() {
    this.isLoading = true; // Set loading state
    
    // Get the current booking data first
    this.fetchBookingWithRetry(this.data.bookingId, 3); // Retry up to 3 times
  }

  // Fetch booking with retry mechanism to handle potential timing issues
  private fetchBookingWithRetry(bookingId: number, maxRetries: number, currentAttempt: number = 1) {
    console.log(`Fetching booking ${bookingId}, attempt #${currentAttempt}`);
    this.apiService.getBookingById(bookingId).subscribe({
      next: (response: any) => {
        console.log('Received full API response:', response);
        
        // Extract the booking from the 'data' property
        const booking = response.data;
        console.log('Extracted booking data:', booking);
        
        this.currentBooking = booking;

        // Clear existing participants in the form
        this.participants.clear();

        // Add existing participants to the form
        if (Array.isArray(booking.participants)) {
          console.log(`Found ${booking.participants.length} participants in booking:`, booking.participants);
          booking.participants.forEach((participant: any) => {
            this.addParticipantToForm(participant.name, participant.email);
          });
        } else {
          console.log('No participants array found in booking or it is not an array:', typeof booking.participants, booking.participants);
        }

        this.showParticipantForm = true;
        this.errorMessage = '';
        this.isLoading = false; // Reset loading state
      },
      error: (error) => {
        console.error(`Attempt ${currentAttempt} failed to fetch booking:`, error);
        
        if (currentAttempt < maxRetries) {
          console.log(`Retrying... (${currentAttempt + 1}/${maxRetries})`);
          // Wait 500ms before retrying
          setTimeout(() => {
            this.fetchBookingWithRetry(bookingId, maxRetries, currentAttempt + 1);
          }, 500);
        } else {
          console.error('All retry attempts failed');
          this.errorMessage = 'Failed to fetch booking data. Please try again.';
          this.isLoading = false; // Reset loading state
        }
      }
    });
  }

  // Add a participant to the form
  addParticipantToForm(name?: string, email?: string) {
    const participantGroup = this.fb.group({
      name: [name || '', Validators.required],
      email: [email || '', [Validators.required, Validators.email]]
    });
    this.participants.push(participantGroup);
  }

  // Remove a participant from the form
  removeParticipant(index: number) {
    this.participants.removeAt(index);
  }

  // Verify PIC email before showing participant form
  verifyPicEmail() {
    if (this.enteredEmail.trim() === this.data.bookingEmail.trim() ||
        this.enteredEmail.trim() === 'fahmi.hamka@dmmxcorp.com' ||
        this.enteredEmail.trim() === 'yessica.noviana@dmmgroup.id') {
      this.loadBookingWithParticipants();
    } else {
      this.errorMessage = 'Email does not match!';
    }
  }

  // Submit all participants to the booking
  submitParticipants() {
    if (this.bookingForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    // Get all participants from the form
    const formParticipants = this.participants.value;

    // Prepare the updated booking object with all participants
    const updatedBooking = {
      ...this.currentBooking,
      participants: formParticipants.map((p: any) => ({
        ...p,
        id: p.id || Date.now(), // Use existing ID if available, otherwise generate temporary
        status: p.status || 'PENDING' // Preserve existing status if available
      }))
    };

    console.log("Updated booking with all participants:", updatedBooking);

    // Call the API to update the booking
    this.apiService.updateBooking(this.data.bookingId, updatedBooking).subscribe({
      next: (response) => {
        console.log('All participants added successfully:', response);
        this.dialogRef.close(true); // Close with success indicator
      },
      error: (error) => {
        console.error('Error adding participants:', error);
        this.errorMessage = 'Failed to add participants. Please try again.';
      }
    });
  }

  // Helper method to get individual participant control
  getParticipantControl(index: number) {
    return this.participants.at(index) as FormGroup;
  }

  // Cancel the operation
  cancel() {
    this.dialogRef.close(null);
  }
}