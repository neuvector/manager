import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { combineLatest, Subject, throwError } from 'rxjs';
import { MultiClusterService } from '@services/multi-cluster.service';
import { ServerGetResponse } from '@common/types';
import { catchError, map } from 'rxjs/operators';
import { pollUntilResult } from '@common/utils/rxjs.utils';


@Component({
  standalone: false,
  selector: 'app-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
  
})
export class LdapComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  ldapError!: string;
  refreshing$ = new Subject();
  ldapData!: { domains: string[]; server: ServerGetResponse };

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
    combineLatest([
      this.settingsService.getServer(),
      this.settingsService.getDomain(),
    ])
      .pipe(
        map(([server, domain]) => {
          return {
            server,
            domains: domain.domains
              .map(d => d.name)
              .filter(name => name.charAt(0) !== '_'),
          };
        }),
        catchError(err => {
          this.ldapError = err;
          return throwError(err);
        })
      )
      .subscribe(ldapData => (this.ldapData = ldapData));
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh(): void {
    pollUntilResult(
      () => this.settingsService.getServer(),
      server =>
        !!server.servers.find(({ server_type }) => server_type === 'ldap'),
      5000,
      30000
    )
      .pipe(
        catchError(err => {
          this.ldapError = err;
          return throwError(err);
        })
      )
      .subscribe(server => {
        this.ldapData = { ...this.ldapData, server };
      });
  }
}
