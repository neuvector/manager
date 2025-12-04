import { Component, Input } from '@angular/core';
import { DomainResponse } from '../compliance-profile.service';

@Component({
  standalone: false,
  selector: 'app-compliance-profile-assets',
  templateUrl: './compliance-profile-assets.component.html',
  styleUrls: ['./compliance-profile-assets.component.scss'],
})
export class ComplianceProfileAssetsComponent {
  @Input() domains!: DomainResponse;

  constructor() {}
}
