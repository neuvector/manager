import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss']
})
export class AgreementComponent implements OnInit {

  isFromSSO: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AgreementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.isFromSSO = this.data.isFromSSO;
  }

  onClose(){
    this.dialogRef.close();
  }

}
