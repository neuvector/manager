import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-token-modal',
  templateUrl: './token-modal.component.html',
  styleUrls: ['./token-modal.component.scss'],
})
export class TokenModalComponent {
  constructor(
    public dialogRef: MatDialogRef<TokenModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.disableClose = false;
  }

  onCancel = () => {
    this.dialogRef.close();
  };
}
