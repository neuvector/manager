import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { CommonHttpService } from '@common/api/common-http.service';
import { ConfigHttpService } from '@common/api/config-http.service';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  GlobalNotification,
  RbacAlertsSummary,
  TelemetryStatus,
  ManagerAlertKey,
  UserAlertKey,
  GlobalNotificationPayLoad,
} from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { DashboardService } from '@services/dashboard.service';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-global-notifications',
  templateUrl: './global-notifications.component.html',
  styleUrls: ['./global-notifications.component.scss'],
})
export class GlobalNotificationsComponent implements OnInit {
  @ViewChild('notificationMenuTrigger')
  notificationMenuTrigger!: MatMenuTrigger;
  globalNotifications: GlobalNotification[] = [];
  version: any;
  rbacData!: RbacAlertsSummary;
  payload: GlobalNotificationPayLoad = {};
  telemetryStatus!: TelemetryStatus | null;
  unUpdateDays!: number;
  get isVersionMismatch() {
    return GlobalVariable.summary.component_versions
      ? (GlobalVariable.summary.component_versions.length > 1 &&
          GlobalVariable.summary.component_versions[0] !==
            GlobalVariable.summary.component_versions[1]) ||
          this.version !==
            (GlobalVariable.summary.component_versions[0].startsWith('v')
              ? GlobalVariable.summary.component_versions[0].substring(1)
              : GlobalVariable.summary.component_versions[0])
      : false;
  }
  get passwordExpiration() {
    return GlobalVariable.user.token.password_days_until_expire;
  }
  get notificationLength() {
    return this.globalNotifications.filter(n => !n.accepted).length;
  }
  get currentUser(): string {
    return GlobalVariable.user.token.username || '';
  }

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    private tr: TranslateService,
    private commonHttpService: CommonHttpService,
    private configHttpService: ConfigHttpService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getVersion();
    this.getRBAC();
    this.getTelemetry();
    this.initNotifData();
  }

  accept(notification: GlobalNotification, event: MouseEvent) {
    if (this.isRbacNotif(notification.name)) {
      this.payload.controller_alerts = [notification.key];
    }
    if (this.isManagerNotif(notification.name)) {
      this.payload.manager_alerts = [notification.key];
    }
    if (this.isUserNotif(notification.name)) {
      this.payload.user_alerts = [notification.key];
    }
    this.notificationService.acceptNotification(this.payload).subscribe(
      () => {
        notification.accepted = true;
      },
      error => {
        this.notificationService.open(
          this.utils.getAlertifyMsg(error.error, this.tr.instant(''), false)
        );
      }
    );
    if (this.notificationLength) event.stopPropagation();
  }

  closeMenu() {
    this.notificationMenuTrigger.closeMenu();
  }

  menuOpened() {
    this.globalNotifications.forEach(n => (n.unClamped = false));
  }

  isClamped(name: string) {
    const el = document.getElementById(name);
    return el ? el.scrollHeight > el.clientHeight : false;
  }

  toggleClamp(notification: GlobalNotification) {
    notification.unClamped = !notification.unClamped;
  }

  initNotifData(): void {
    if (
      this.version &&
      this.rbacData &&
      this.telemetryStatus !== undefined &&
      GlobalVariable.hasInitializedSummary &&
      GlobalVariable.user
    ) {
      this.unUpdateDays = this.getUnUpdateDays();
      this.generateNotifications();
    } else {
      setTimeout(() => this.initNotifData());
    }
  }

  generateNotifications(): void {
    if (
      this.telemetryStatus?.max_upgrade_version.tag &&
      this.isUpgradeNeeded(
        this.telemetryStatus.current_version,
        this.telemetryStatus.max_upgrade_version.tag
      )
    ) {
      this.globalNotifications.push({
        name: 'newVersionAvailable',
        key: ManagerAlertKey.NewVersionAvailable,
        message: this.tr.instant('login.UPGRADE_AVAILABLE', {
          currentVersion: this.telemetryStatus.current_version,
          newVersion: this.telemetryStatus.max_upgrade_version.tag,
        }),
        link: '',
        labelClass: 'warning',
        accepted: this.rbacData.accepted_alerts
          ? this.rbacData.accepted_alerts.includes(
              ManagerAlertKey.NewVersionAvailable
            )
          : false,
        unClamped: false,
      });
    }
    if (this.unUpdateDays > GlobalConstant.MAX_UNUPDATED_DAYS) {
      this.globalNotifications.push({
        name: 'isScannerOld',
        key: ManagerAlertKey.OutdatedCVE,
        message: this.tr.instant('login.CVE_DB_OLD', {
          day: Math.round(this.unUpdateDays),
        }),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: this.rbacData.accepted_alerts
          ? this.rbacData.accepted_alerts.includes(ManagerAlertKey.OutdatedCVE)
          : false,
        unClamped: false,
      });
    }
    if (this.isVersionMismatch) {
      this.globalNotifications.push({
        name: 'isVersionMismatch',
        key: ManagerAlertKey.VersionMismatch,
        message: this.tr.instant('login.VERSION_MISMATCHED'),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: this.rbacData.accepted_alerts
          ? this.rbacData.accepted_alerts.includes(
              ManagerAlertKey.VersionMismatch
            )
          : false,
        unClamped: false,
      });
    }
    if (this.passwordExpiration >= 0 && this.passwordExpiration < 10) {
      this.globalNotifications.push({
        name: 'isPasswordExpiring',
        key: UserAlertKey.ExpiringPassword,
        message: this.tr.instant('login.CHANGE_EXPIRING_PASSWORD', {
          expiring_Days: this.passwordExpiration + 1,
        }),
        link: '#/profile',
        labelClass: this.passwordExpiration < 1 ? 'danger' : 'warning',
        accepted: this.rbacData.accepted_alerts
          ? this.rbacData.accepted_alerts.includes(
              UserAlertKey.ExpiringPassword
            )
          : false,
        unClamped: false,
      });
    }
    if (
      GlobalVariable.user.token.default_password &&
      GlobalVariable.user.token.server.toLowerCase() !== 'rancher'
    ) {
      this.globalNotifications.push({
        name: 'isDefaultPassword',
        key: UserAlertKey.UnchangedDefaultPassword,
        message: this.tr.instant('login.CHANGE_DEFAULT_PASSWORD'),
        link: '#/profile',
        labelClass: 'warning',
        accepted: this.rbacData.accepted_alerts
          ? this.rbacData.accepted_alerts.includes(
              UserAlertKey.UnchangedDefaultPassword
            )
          : false,
        unClamped: false,
      });
    }

    // Loop through each type of RBAC alert in the acceptable_alerts data
    // Push notifications to the globalNotification array for each alert
    if (this.rbacData.acceptable_alerts) {
      Object.keys(this.rbacData.acceptable_alerts).forEach(rbacAlertType => {
        const alert = this.rbacData.acceptable_alerts[rbacAlertType];
        if (alert && Object.keys(alert).length > 0) {
          Object.keys(alert).forEach(key => {
            this.globalNotifications.push({
              name: rbacAlertType + ':' + alert[key],
              key: key,
              message: alert[key],
              link: '',
              labelClass: 'danger',
              accepted: this.rbacData.accepted_alerts
                ? this.rbacData.accepted_alerts.includes(key)
                : false,
              unClamped: false,
            });
          });
        }
      });
    }
  }

  getUnUpdateDays() {
    let currentTime = new Date().getTime();
    let cveDBCreateTime = GlobalVariable.summary.cvedb_create_time
      ? Date.parse(GlobalVariable.summary.cvedb_create_time)
      : 0;
    return cveDBCreateTime > 0
      ? (currentTime - cveDBCreateTime) / (24 * 3600 * 1000)
      : 0;
  }

  /**
   * Compares two version strings to determine if an upgrade is needed.
   *
   * @param currentVersion - The current version to compare.
   * @param maxVersion - The maximum allowed version to compare against.
   * @returns `true` if an upgrade is needed, `false` otherwise.
   *
   * Example: ensure "5.2.3" > "5.2.2-s2" > "5.2.2-s1" > "5.2.2"
   */
  isUpgradeNeeded(currentVersion: string, maxVersion: string) {
    if (!currentVersion || !maxVersion) {
      return false;
    }

    const currentParts = currentVersion.split('.');
    const maxParts = maxVersion.split('.');

    for (let i = 0; i < Math.max(currentParts.length, maxParts.length); i++) {
      const current = parseInt(currentParts[i]) || 0;
      const max = parseInt(maxParts[i]) || 0;

      if (current < max) {
        return true;
      } else if (current > max) {
        return false;
      }
    }

    // Handle the special case where one version includes a suffix (e.g., -s or -a)
    if (currentVersion.includes('-') || maxVersion.includes('-')) {
      const currentSuffix = currentVersion.split('-')[1] || '';
      const maxSuffix = maxVersion.split('-')[1] || '';

      if (currentSuffix < maxSuffix) {
        return true;
      }
    }

    // Return false when the currentVVersion is the same as the maxVersion
    return false;
  }

  getVersion() {
    GlobalVariable.versionDone = false;
    this.commonHttpService
      .getVersion()
      .pipe(
        map(version => {
          if (version && version[0] === 'v') {
            return version.substring(1);
          }
          return version;
        })
      )
      .subscribe({
        next: version => {
          this.version = version;
          GlobalVariable.versionDone = true;
          GlobalVariable.version = version;
        },
      });
  }

  getTelemetry() {
    this.configHttpService
      .getConfig()
      .pipe(
        switchMap(config =>
          !config.misc.no_telemetry_report
            ? this.configHttpService.getUsageReport().pipe(
                map(usageReport => usageReport.telemetry_status),
                catchError(() => of(null))
              )
            : of(null)
        ),
        catchError(() => of(null))
      )
      .subscribe({
        next: telemetryStatus => {
          this.telemetryStatus = telemetryStatus;
        },
      });
  }

  getRBAC() {
    this.dashboardService.getRbacData().subscribe({
      next: rbac => {
        this.rbacData = rbac;
      },
    });
  }

  isRbacNotif(name: string) {
    return (
      name.startsWith('clusterrole_errors:') ||
      name.startsWith('clusterrolebinding_errors:') ||
      name.startsWith('rolebinding_errors:') ||
      name.startsWith('role_errors:') ||
      name.startsWith('neuvector_crd_errors:')
    );
  }

  isManagerNotif(name: string) {
    return (
      name.startsWith('isScannerOld') ||
      name.startsWith('isVersionMismatch') ||
      name.startsWith('newVersionAvailable')
    );
  }

  isUserNotif(name: string) {
    return (
      name.startsWith('isPasswordExpiring') ||
      name.startsWith('isDefaultPassword')
    );
  }

  getRbacTitle(name: string) {
    return this.tr.instant(
      'dashboard.body.message.' + name.split(':')[0].toUpperCase()
    );
  }
}
