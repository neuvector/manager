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

  ngOnInit(): void {
  }

  openEULAPage() {
    this.dialog.open(AgreementComponent, {
      data: { isFromSSO: false},
      width: '80vw',
      height: '685px',
    });
  }

  onCheck(isChecked: boolean) {
    this.eulaStatus.emit(isChecked);
  }
}
