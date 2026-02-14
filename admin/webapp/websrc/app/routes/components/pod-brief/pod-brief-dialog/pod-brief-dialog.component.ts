import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Workload } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-pod-brief-dialog',
  templateUrl: './pod-brief-dialog.component.html',
  styleUrls: ['./pod-brief-dialog.component.scss'],
})
export class PodBriefDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PodBriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('data', data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
