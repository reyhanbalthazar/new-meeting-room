import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';


@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.css']
})
export class BookingModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string; subMessage: string, button1: string, button2: string, type: string },
    private dialogRef: MatDialogRef<BookingModalComponent>,
    private dialog: MatDialog,
    private router: Router
  ) { }

  // Function to close modal and pass result back
  closeModal(result: boolean = false) {
    this.dialogRef.close(result);
  }

  closeModalAndRedirect(confirmed: boolean) {
    this.dialog.closeAll();
    if (confirmed) {
      this.router.navigate(['/']);
    }
  }
}
