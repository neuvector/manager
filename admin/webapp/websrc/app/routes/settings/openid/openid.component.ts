import { Component } from '@angular/core';
import { combineLatest, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-openid',
  templateUrl: './openid.component.html',
  styleUrls: ['./openid.component.scss'],
})
export class OpenidComponent {
  openidError!: string;
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  openidData$ = combineLatest([this.server$, this.domain$]).pipe(
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
    })
  );

  constructor(private settingsService: SettingsService) {}
}
