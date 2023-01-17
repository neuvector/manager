import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, throwError, Observable } from 'rxjs';
import { catchError, map, repeatWhen } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import {
  ServerGetResponse,
  DomainGetResponse
} from '@common/types';

@Component({
  selector: 'app-openid',
  templateUrl: './openid.component.html',
  styleUrls: ['./openid.component.scss'],
})
export class OpenidComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  openidError!: string;
  refreshing$ = new Subject();

  server$: Observable<ServerGetResponse>;
  domain$: Observable<DomainGetResponse>;
  openidData$: Observable<any>;

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private router: Router
  ) {
    this.server$ = this.settingsService.getServer();
    this.domain$ = this.settingsService.getDomain();
    this.openidData$ = combineLatest([this.server$, this.domain$]).pipe(
      map(([server, domain]) => {
        return {
          server,
          domains: domain.domains
            .map(d => d.name)
            .filter(name => name.charAt(0) !== '_'),
        };
      }),
      catchError(err => {
        this.openidError = err;
        return throwError(err);
      }),
      repeatWhen(() => this.refreshing$)
    );
  }

  ngOnInit(): void {
    this._switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(
      () => {
        this.router.navigate(['settings']);
      }
    );
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
