import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { combineLatest, Subject } from 'rxjs';
import { map, repeatWhen } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
})
export class LdapComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  refreshing$ = new Subject();
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
    }),
    repeatWhen(() => this.refreshing$)
  );

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh(): void {
    this.refreshing$.next(true);
  }
}
