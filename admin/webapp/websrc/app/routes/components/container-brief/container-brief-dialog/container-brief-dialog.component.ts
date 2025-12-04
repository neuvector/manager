import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-container-brief-dialog',
  templateUrl: './container-brief-dialog.component.html',
  styleUrls: ['./container-brief-dialog.component.scss'],
})
export class ContainerBriefDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ContainerBriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
