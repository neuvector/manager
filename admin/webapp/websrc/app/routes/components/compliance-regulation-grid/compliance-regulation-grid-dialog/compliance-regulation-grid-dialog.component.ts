import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ComplianceCsvService } from '@routes/compliance/csv-generation/compliance-csv.service';

@Component({
  standalone: false,
  selector: 'app-compliance-regulation-grid-dialog',
  templateUrl: './compliance-regulation-grid-dialog.component.html',
  styleUrls: ['./compliance-regulation-grid-dialog.component.scss'],
})
export class ComplianceRegulationGridDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ComplianceRegulationGridDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private complianceCsvService: ComplianceCsvService
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  downloadCsv(): void {
    this.complianceCsvService.downloadRegulationCsv(this.data);
  }
}
