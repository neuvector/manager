import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AgreementComponent } from '@routes/pages/login/eula/agreement/agreement.component';

@Component({
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent implements OnInit {
  @Output() eulaStatus = new EventEmitter<boolean>();

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  openEULAPage() {
    this.dialog.open(AgreementComponent, {
      disableClose: true,
      data: { showAcceptButton: false, showCustomPolicy: false },
      width: '80vw',
      height: '90vh',
    });
  }

  onCheck(isChecked: boolean) {
    this.eulaStatus.emit(isChecked);
  }
}
