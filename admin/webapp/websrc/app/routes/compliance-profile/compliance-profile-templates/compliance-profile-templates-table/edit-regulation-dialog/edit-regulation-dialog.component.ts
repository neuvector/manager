import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  standalone: false,
  selector: 'app-edit-regulation-dialog',
  templateUrl: './edit-regulation-dialog.component.html',
  styleUrls: ['./edit-regulation-dialog.component.scss'],
  
})
export class EditRegulationDialogComponent implements OnInit {
  regulations: string[] = [];
  available: string[] = [];
  applied: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditRegulationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    this.regulations = this.data.regulations;
    this.applied = this.data.tags || [];
    this.filterApplied();
  }

  filterApplied() {
    this.available = this.regulations.filter(
      tag => !this.applied.includes(tag)
    );
  }

  filterAvailable() {
    this.applied = this.regulations.filter(
      tag => !this.available.includes(tag)
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  add(tag) {
    this.applied.push(tag);
    this.filterApplied();
  }

  remove(tag) {
    this.available.push(tag);
    this.filterAvailable();
  }

  save() {
    this.dialogRef.close(this.applied);
  }
}
