import { Component, Input, OnInit } from '@angular/core';
import { Check } from '@common/types';

@Component({
  selector: 'app-remediation-detail-dialog',
  templateUrl: './remediation-detail-dialog.component.html',
  styleUrls: ['./remediation-detail-dialog.component.scss'],
})
export class RemediationDetailDialogComponent implements OnInit {
  @Input() compliance!: Check;
  visible: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }
}
