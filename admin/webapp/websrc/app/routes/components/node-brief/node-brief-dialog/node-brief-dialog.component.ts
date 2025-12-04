import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Host } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-node-brief-dialog',
  templateUrl: './node-brief-dialog.component.html',
  styleUrls: ['./node-brief-dialog.component.scss'],
})
export class NodeBriefDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NodeBriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Host
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
