import { Component, Input } from '@angular/core';
import { Check } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-remediation-detail-dialog',
  templateUrl: './remediation-detail-dialog.component.html',
  styleUrls: ['./remediation-detail-dialog.component.scss'],
})
export class RemediationDetailDialogComponent {
  @Input() compliance!: Check;
  @Input() isRegistryDialog: boolean = false;
  visible: boolean = false;

  constructor() {}

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }
}
