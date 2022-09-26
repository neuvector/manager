import { Component } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
})
export class LdapComponent {
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  ldapData$ = combineLatest([this.server$, this.domain$]).pipe(
    map(([server, domain]) => {
      return {
        server,
        domains: domain.domains
          .map(d => d.name)
          .filter(name => name.charAt(0) !== '_'),
      };
    })
  );

  constructor(private settingsService: SettingsService) {}
}
