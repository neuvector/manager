import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss']
})
export class AgreementComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<AgreementComponent>
  ) { }

  ngOnInit(): void {
  }

  onClose(){
    this.dialogRef.close();
  }

}
