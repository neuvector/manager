import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AgreementComponent } from '@routes/pages/login/eula/agreement/agreement.component';

@Component({
  standalone: false,
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent {
  @Output() eulaStatus = new EventEmitter<boolean>();

  constructor(private dialog: MatDialog) {}

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
