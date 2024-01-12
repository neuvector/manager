import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-export-options-modal',
  templateUrl: './export-options-modal.component.html',
  styleUrls: ['./export-options-modal.component.scss'],
})
export class ExportOptionsModalComponent implements OnInit {
  exportForm!: FormGroup;
  exportFileName!: string;
  constructor(
    public dialogRef: MatDialogRef<ExportOptionsModalComponent>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.exportFileName = this.data.filename;
    this.exportForm = this.fb.group({});
  }

  onCancel = () => {
    this.dialogRef.close();
  };

  onSubmit(): void {
    this.dialogRef.close(this.exportForm.value);
  }
}
