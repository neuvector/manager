import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Host } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-enforcer-brief-dialog',
  templateUrl: './enforcer-brief-dialog.component.html',
  styleUrls: ['./enforcer-brief-dialog.component.scss'],
})
export class EnforcerBriefDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EnforcerBriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
