import { Component } from '@angular/core';
import { combineLatest, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-saml',
  templateUrl: './saml.component.html',
  styleUrls: ['./saml.component.scss'],
})
export class SamlComponent {
  samlError!: string;
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  samlData$ = combineLatest([this.server$, this.domain$]).pipe(
    map(([server, domain]) => {
      return {
        server,
        domains: domain.domains
          .map(d => d.name)
          .filter(name => name.charAt(0) !== '_'),
      };
    }),
    catchError(err => {
      this.samlError = err;
      return throwError(err);
    })
  );

  constructor(private settingsService: SettingsService) {}
}
