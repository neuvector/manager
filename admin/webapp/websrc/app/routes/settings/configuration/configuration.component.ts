import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { ConfigV2Response, Enforcer, RemoteRepository } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '@services/settings.service';
import { Observable } from 'rxjs';
import { ConfigFormComponent } from './config-form/config-form.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import { ConfigV2Vo } from '@common/types/settings/config-vo';


@Component({
  standalone: false,
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  
})
export class ConfigurationComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  @ViewChild(ConfigFormComponent) configForm!: ConfigFormComponent;

  private _switchClusterSubscription;
  private _refreshConfigSubscription;

  config!: ConfigV2Vo;
  enforcers!: Enforcer[];
  isConfigAuthorized!: boolean;
  isImportAuthorized!: boolean;

  get debug_enabled(): boolean {
    return (
      this.config.misc.controller_debug.length > 0 &&
      this.config.misc.controller_debug[0] === 'cpath'
    );
  }
  get remoteRepository(): RemoteRepository | undefined {
    return this.config.remote_repositories &&
      this.config.remote_repositories.length > 0
      ? this.config.remote_repositories[0]
      : undefined;
  }

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private authUtils: AuthUtilsService,
    private router: Router,
    private tr: TranslateService,
    private cdr: ChangeDetectorRef
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
    this.settingsService.getConfig().subscribe({
      next: (value: ConfigV2Response) => {
        this.config = {
          ...value,
          tls: {
            enable_tls_verification:
              value.tls_cfg?.enable_tls_verification ?? true,
            cacerts: value.tls_cfg?.cacerts?.map(
              (c, i) =>
                ({
                  id: i,
                  context: c,
                })
            ),
          },
        };
        this.multiClusterService.clusterName = value.misc.cluster_name;

        //fix error ExpressionChangedAfterItHasBeenCheckedError
        this.cdr.detectChanges();
      },
    });
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        const currentUrl = this.router.url;
        this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() => {
            this.router.navigate([currentUrl]);
          });
      });
    this._refreshConfigSubscription = this.settingsService
      .getRefreshConfigSubject()
      .subscribe({
        next: () => {
          const currentUrl = this.router.url;
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => {
              this.router.navigate([currentUrl]);
            });
        },
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
    if (this._refreshConfigSubscription) {
      this._refreshConfigSubscription.unsubscribe();
    }
  }
}
