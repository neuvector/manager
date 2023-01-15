import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { combineLatest, Subject, Observable } from 'rxjs';
import { map, repeatWhen } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';
import {
  ServerGetResponse,
  DomainGetResponse
} from '@common/types';

@Component({
  selector: 'app-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
})
export class LdapComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  refreshing$ = new Subject();
  server$: Observable<ServerGetResponse>;
  domain$: Observable<DomainGetResponse>;
  ldapData$: Observable<any>;

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {
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
      }),
      repeatWhen(() => this.refreshing$)
    );
  }

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
