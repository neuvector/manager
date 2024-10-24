import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-policy-mode-caution',
  templateUrl: './policy-mode-caution.component.html',
  styleUrls: ['./policy-mode-caution.component.scss'],
})
export class PolicyModeCautionComponent {
  @Input() assetType: string;

  constructor() {}
}
