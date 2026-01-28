import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-flag-ip-fqdn',
  templateUrl: './flag-ip-fqdn.component.html',
  styleUrls: ['./flag-ip-fqdn.component.scss'],
})
export class FlagIpFqdnComponent {
  @Input() ip: string;
  @Input() countryCode: string = '-';
  @Input() countryName: string = '';
  @Input() fqdn: string = '';

  constructor() {}
}
