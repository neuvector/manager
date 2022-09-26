import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { ConfigResponse, Enforcer } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '@services/settings.service';
import { Observable, Subject } from 'rxjs';
import { repeatWhen } from 'rxjs/operators';
import { ConfigFormComponent } from './config-form/config-form.component';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements OnInit, ComponentCanDeactivate {
  @ViewChild(ConfigFormComponent) configForm!: ConfigFormComponent;
  config!: ConfigResponse;
  enforcers!: Enforcer[];
  refreshConfig$ = new Subject();
  get debug_enabled(): boolean {
    return (
      this.config.controller_debug.length > 0 &&
      this.config.controller_debug[0] === 'cpath'
    );
  }

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService
  ) {}

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.configForm?.configForm?.dirty
      ? confirm(this.tr.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  ngOnInit(): void {
    this.settingsService
      .getConfig()
      .pipe(repeatWhen(() => this.refreshConfig$))
      .subscribe({
        next: value => (this.config = value),
      });
  }

  refreshConfig(): void {
    setTimeout(() => {
      this.refreshConfig$.next(true);
    }, 500);
  }
}
