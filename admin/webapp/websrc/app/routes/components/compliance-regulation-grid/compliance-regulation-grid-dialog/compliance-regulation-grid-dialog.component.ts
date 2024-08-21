import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-compliance-regulation-grid-dialog',
  templateUrl: './compliance-regulation-grid-dialog.component.html',
  styleUrls: ['./compliance-regulation-grid-dialog.component.scss'],
})
export class ComplianceRegulationGridDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ComplianceRegulationGridDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
