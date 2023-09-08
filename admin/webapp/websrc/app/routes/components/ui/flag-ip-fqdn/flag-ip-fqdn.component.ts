import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-flag-ip-fqdn',
  templateUrl: './flag-ip-fqdn.component.html',
  styleUrls: ['./flag-ip-fqdn.component.scss']
})
export class FlagIpFqdnComponent implements OnInit {

  @Input() ip: string;
  @Input() countryCode: string = '-'
  @Input() countryName: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
