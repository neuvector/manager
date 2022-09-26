import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-ports-full-list-modal',
  templateUrl: './ports-full-list-modal.component.html',
  styleUrls: ['./ports-full-list-modal.component.scss']
})
export class PortsFullListModalComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<PortsFullListModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

}
