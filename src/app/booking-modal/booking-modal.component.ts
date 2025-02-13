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
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string,
      message: string,
      subMessage: string,
      button1: string,
      button2: string,
      btnWaMe: string,
      roomName: string,
      startTime: string,
      endTime: string,
      type: string
    },
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

  btnWaMe(confirmed: boolean) {
    this.dialog.closeAll();
    if (confirmed) {
      window.open(`https://wa.me/628997566261?text=Halo!%0A%0ASaya%20baru%20saja%20reservasi%20meeting%20room%0Adi%20https://dev-digimax-room.web.app/%0A%0AUntuk%20ruang%20meeting%20dan%20jam%20berikut%20:%0A*${this.data.roomName}*%0A*${this.data.startTime}*%0A*${this.data.endTime}*`, '_blank');
    }
  }
}
