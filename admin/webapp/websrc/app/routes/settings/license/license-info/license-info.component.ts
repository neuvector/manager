import { Component, Input } from '@angular/core';
import { LicenseGetResponse } from '@common/types';

@Component({
  selector: 'app-license-info',
  templateUrl: './license-info.component.html',
  styleUrls: ['./license-info.component.scss'],
})
export class LicenseInfoComponent {
  @Input() license!: LicenseGetResponse;
}
