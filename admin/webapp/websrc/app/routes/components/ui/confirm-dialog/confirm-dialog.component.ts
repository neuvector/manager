import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Output, EventEmitter } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  loading = false;
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  @Output() confirm = new EventEmitter();
  onConfirm(): void {
    this.loading = true;
    if (this.data.isSync) {
      this.dialogRef.close(true);
    } else {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
