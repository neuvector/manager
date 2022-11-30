import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { ConfigV2Response, Enforcer } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '@services/settings.service';
import { Observable, Subject } from 'rxjs';
import { repeatWhen } from 'rxjs/operators';
import { ConfigFormComponent } from './config-form/config-form.component';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements OnInit, ComponentCanDeactivate {
  private _switchClusterSubscription;
  @ViewChild(ConfigFormComponent) configForm!: ConfigFormComponent;
  config!: ConfigV2Response;
  enforcers!: Enforcer[];
  refreshConfig$ = new Subject();
  isConfigAuthorized!: boolean;
  isImportAuthorized!: boolean;
  get debug_enabled(): boolean {
    return (
      this.config.misc.controller_debug.length > 0 &&
      this.config.misc.controller_debug[0] === 'cpath'
    );
  }

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private authUtils: AuthUtilsService,
    private tr: TranslateService
  ) {}

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.configForm?.configForm?.dirty
      ? confirm(this.tr.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  ngOnInit(): void {
    this.isConfigAuthorized = this.authUtils.getDisplayFlag('write_config');
    this.isImportAuthorized =
      GlobalVariable.user.token.role === MapConstant.FED_ROLES.FEDADMIN ||
      (GlobalVariable.user.token.role === MapConstant.FED_ROLES.ADMIN &&
        (GlobalVariable.isStandAlone || GlobalVariable.isMember));
    this.settingsService
      .getConfig()
      .pipe(repeatWhen(() => this.refreshConfig$))
      .subscribe({
        next: value => (this.config = value),
      });
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refreshConfig();
      });
  }

  refreshConfig(): void {
    setTimeout(() => {
      this.refreshConfig$.next(true);
    }, 500);
  }
}
