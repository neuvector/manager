import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-ports-full-list-modal',
  templateUrl: './ports-full-list-modal.component.html',
  styleUrls: ['./ports-full-list-modal.component.scss'],
})
export class PortsFullListModalComponent {
  constructor(
    public dialogRef: MatDialogRef<PortsFullListModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel = () => {
    this.dialogRef.close(false);
  };
}
