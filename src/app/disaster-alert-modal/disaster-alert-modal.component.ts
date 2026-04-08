import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DisasterAlertDialogData {
  note: string;
}

@Component({
  selector: 'app-disaster-alert-modal',
  templateUrl: './disaster-alert-modal.component.html',
  styleUrls: ['./disaster-alert-modal.component.css']
})
export class DisasterAlertModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DisasterAlertDialogData,
    private dialogRef: MatDialogRef<DisasterAlertModalComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
