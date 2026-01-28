import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { ConfigPatch, ErrorResponse, IBMSetupGetResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { FormlyFormOptions } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';
import { ConfigFormConfig } from './config-form-config';
import { OtherWebhookType } from './config-form-config/constants';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfigV2Vo } from '@common/types/settings/config-vo';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  standalone: false,
  selector: 'app-config-form',
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
})
export class ConfigFormComponent implements OnInit {
  private _config!: ConfigV2Vo;

  ibmSetup!: IBMSetupGetResponse;
  submittingForm = false;
  configForm = new FormGroup({});
  configFields = cloneDeep(ConfigFormConfig);
  configOptions: FormlyFormOptions = {
    formState: {
      isCreated: {
        httpProxy: false,
        httpsProxy: false,
      },
      isOpenShift: () => GlobalVariable.isOpenShift,
      isRancherSSO: () =>
        GlobalVariable.user.token.server
          .toLowerCase()
          .includes(MapConstant.AUTH_PROVIDER.RANCHER.toLowerCase()),
      isOpenShiftSSO: () =>
        GlobalVariable.user.token.server ===
        MapConstant.AUTH_PROVIDER.OPENSHIFT,
      permissions: {},
      ibmsa: {
        setup: this.setupIBMSA.bind(this),
        enabled: false,
      },
      tr: {
        rancher_ep: this.tr.instant('setting.RANCHER_EP'),
        min_max: this.tr.instant('setting.autoscale.MIN_MAX'),
      },
      slider_formatter: this.utils.convertHours.bind(this.utils),
    },
  };
  serverErrorMessage: SafeHtml = '';

  get dashboardUrl(): string {
    return `${this.document.location.origin}/`;
  }

  get config(): ConfigV2Vo {
    return this._config;
  }

  @Input() set config(val) {
    this._config = val;
    if (this._config.proxy.registry_http_proxy.url) {
      this.configOptions.formState.isCreated.httpProxy = true;
    }
    if (this._config.proxy.registry_https_proxy.url) {
      this.configOptions.formState.isCreated.httpsProxy = true;
    }
    if (this._config.misc.unused_group_aging) {
      this._config.duration_toggle = true;
    }
    this._config.mode_auto.mode_auto_d2m_duration /= 3600;
    this._config.mode_auto.mode_auto_m2p_duration /= 3600;
    this._config.webhooks.forEach(e => {
      if (e.cfg_type === GlobalConstant.CFG_TYPE.FED) {
        e.isEditable = false;
      } else {
        e.isEditable = true;
      }
      e.type = e.type || OtherWebhookType;
    });
    this._config.ibmsa.ibmsa_ep_dashboard_url ||= this.dashboardUrl;
  }

  constructor(
    private settingsService: SettingsService,
    private multiClusterService: MultiClusterService,
    private utils: UtilsService,
    private tr: TranslateService,
    private domSanitizer: DomSanitizer,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const isSettingAuth = this.authUtilsService.getDisplayFlag('write_config');

    this.configOptions.formState.permissions = {
      isAuthenticateRBACAuthorized: isSettingAuth,
      isNewServiceModeAuthorized: isSettingAuth,
      isClusterAuthorized: isSettingAuth && GlobalVariable.isStandAlone,
      isWebhookAuthorized: isSettingAuth,
      isSyslogAuthorized: isSettingAuth,
      isRegHttpProxyAuthorized: isSettingAuth,
      isRegHttpsProxyAuthorized: isSettingAuth,
      isConfigAuthorized: isSettingAuth,
      isIBMSAAuthorized: isSettingAuth,
      isTlsAuthorized: isSettingAuth,
      isNsUserExportNetworkRuleAuthorized: isSettingAuth,
    };
    this.serverErrorMessage = '';
    this.cd.detectChanges();

    // reset the status of the sliders to fix the issue NVSHAS-8599
    setTimeout(() => {
      this.configForm.markAsPristine();
    }, 300);
  }

  submitForm(): void {
    this.serverErrorMessage = '';
    if (!this.configForm.valid) {
      return;
    }

    const configPatch: ConfigPatch = this.formatConfigPatch(
      this.configForm.getRawValue() as ConfigV2Vo
    );

    this.submittingForm = true;
    this.settingsService
      .patchConfig(configPatch)
      .pipe(finalize(() => (this.submittingForm = false)))
      .subscribe({
        complete: () => {
          if (
            this._config.misc.cluster_name !==
            this.multiClusterService.clusterName
          ) {
            this.multiClusterService.clusterName =
              this._config.misc.cluster_name;
            this.multiClusterService.dispatchClusterNameChangeEvent();
          }
          this.notificationService.open(this.tr.instant('setting.SUBMIT_OK'));
          this.configOptions.resetModel?.(this._config);
          setTimeout(() => this.configOptions.resetModel?.(this._config));
        },
        error: ({ error }: { error: ErrorResponse }) => {
          if (
            error.message &&
            error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
          ) {
            this.serverErrorMessage = this.domSanitizer.bypassSecurityTrustHtml(
              error.message
            );
          }

          this.notificationService.open(
            this.serverErrorMessage
              ? this.tr.instant('setting.SUBMIT_FAILED')
              : this.utils.getAlertifyMsg(
                  error,
                  this.tr.instant('setting.SUBMIT_FAILED'),
                  false
                ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        },
      });
  }

  formatConfigPatch(base_config: ConfigV2Vo): ConfigPatch {
    return {
      atmo_config: {
        mode_auto_d2m: base_config.mode_auto.mode_auto_d2m,
        mode_auto_d2m_duration:
          base_config.mode_auto.mode_auto_d2m_duration * 3600,
        mode_auto_m2p: base_config.mode_auto.mode_auto_m2p,
        mode_auto_m2p_duration:
          base_config.mode_auto.mode_auto_m2p_duration * 3600,
      },
      net_config: {
        net_service_policy_mode: base_config.net_svc.net_service_policy_mode,
        net_service_status: base_config.net_svc.net_service_status,
        disable_net_policy: base_config.net_svc.disable_net_policy,
        strict_group_mode: base_config.net_svc.strict_group_mode,
      },
      config_v2: {
        svc_cfg: {
          new_service_policy_mode: base_config.new_svc.new_service_policy_mode,
          new_service_profile_mode:
            base_config.new_svc.new_service_profile_mode,
          new_service_profile_baseline:
            base_config.new_svc.new_service_profile_baseline,
        },
        syslog_cfg: {
          syslog_ip: base_config.syslog.syslog_ip,
          syslog_ip_proto: base_config.syslog.syslog_ip_proto,
          syslog_port: Number(base_config.syslog.syslog_port),
          syslog_level: base_config.syslog.syslog_level,
          syslog_status: base_config.syslog.syslog_status,
          output_event_to_logs: base_config.syslog.output_event_to_logs,
          syslog_categories: base_config.syslog.syslog_categories,
          syslog_in_json: base_config.syslog.syslog_in_json,
          single_cve_per_syslog: base_config.syslog.single_cve_per_syslog,
          syslog_cve_in_layers: base_config.syslog.syslog_cve_in_layers,
          syslog_server_cert: base_config.syslog.syslog_server_cert,
        },
        auth_cfg: {
          // NOTE: auth_cfg = {} - formly is missing auth_cfg fields
          auth_order: base_config.auth.auth_order,
          auth_by_platform: base_config.auth.auth_by_platform,
          rancher_ep: base_config.auth.rancher_ep,
        },
        proxy_cfg: {
          registry_http_proxy: base_config.proxy.registry_http_proxy,
          registry_https_proxy: base_config.proxy.registry_https_proxy,
          registry_http_proxy_cfg: base_config.proxy.registry_http_proxy
            .password
            ? base_config.proxy.registry_http_proxy
            : Object.assign({}, base_config.proxy.registry_http_proxy, {
                password: null,
              }),
          registry_http_proxy_status:
            base_config.proxy.registry_http_proxy_status,
          registry_https_proxy_cfg: base_config.proxy.registry_https_proxy
            .password
            ? base_config.proxy.registry_https_proxy
            : Object.assign({}, base_config.proxy.registry_https_proxy, {
                password: null,
              }),
          registry_https_proxy_status:
            base_config.proxy.registry_https_proxy_status,
        },
        webhooks: base_config.webhooks
          .filter(w => w.cfg_type !== GlobalConstant.CFG_TYPE.FED)
          .map(({ isEditable, ...webhook }) => {
            if (webhook.type === OtherWebhookType) {
              webhook.type = '';
            }
            webhook.url = webhook.url.trim();
            return webhook;
          }),
        ibmsa_cfg: {
          ibmsa_ep_dashboard_url:
            base_config.ibmsa.ibmsa_ep_dashboard_url || this.dashboardUrl,
          ibmsa_ep_enabled: base_config.ibmsa.ibmsa_ep_enabled,
        },
        scanner_autoscale_cfg: base_config.scanner_autoscale,
        misc_cfg: {
          controller_debug: base_config.misc.controller_debug,
          unused_group_aging: base_config.duration_toggle
            ? base_config.misc.unused_group_aging
            : 0,
          cluster_name: base_config.misc.cluster_name,
          monitor_service_mesh: base_config.misc.monitor_service_mesh,
          xff_enabled: base_config.misc.xff_enabled,
          no_telemetry_report: base_config.misc.no_telemetry_report,
          allow_ns_user_export_net_policy:
            base_config.misc.allow_ns_user_export_net_policy,
        },
        tls_cfg: {
          enable_tls_verification: base_config.tls['enable_tls_verification'],
          cacerts: base_config.tls['cacerts'].map(c => c.context),
        },
      },
    };
  }

  setupIBMSA(): void {
    this.settingsService.getIBMSetup().subscribe({
      next: (setup: IBMSetupGetResponse) => {
        const expiring_time = this.utils.getDateByInterval(
          this.utils.parseDatetimeStr(new Date()),
          30,
          this.utils.CALENDAR.MINUTES,
          'yyyy-MM-dd HH:mm:ss'
        );
        setup.expiring_time = this.formatExpire(expiring_time || '');
        this.configForm.patchValue({ ibmsa_setup: setup });
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.configForm.patchValue({
          ibmsa_setup: {
            url: '',
            expiring_time: this.utils.getAlertifyMsg(
              error,
              this.tr.instant('setting.IBM_SA_ERR'),
              false
            ),
          },
        });
      },
    });
  }

  formatExpire(time: string) {
    return this.tr.instant('setting.URL_EXPIRE', { time: time });
  }
}
