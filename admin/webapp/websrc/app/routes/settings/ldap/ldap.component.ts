import { Component } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { combineLatest} from 'rxjs';
import { map } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
})
export class LdapComponent {
  private _switchClusterSubscription;
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

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.server$ = this.settingsService.getServer();
        this.domain$ = this.settingsService.getDomain();
        this.ldapData$ = combineLatest([this.server$, this.domain$]).pipe(
          map(([server, domain]) => {
            return {
              server,
              domains: domain.domains
                .map(d => d.name)
                .filter(name => name.charAt(0) !== '_'),
            };
          })
        );
      });
  }
}
