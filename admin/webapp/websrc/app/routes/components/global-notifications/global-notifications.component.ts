import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { CommonHttpService } from '@common/api/common-http.service';
import { ConfigHttpService } from '@common/api/config-http.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalNotification, RbacStatus, TelemetryStatus } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { DashboardService } from '@services/dashboard.service';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
  rbacData!: RbacStatus;
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
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.getVersion();
    this.getRBAC();
    this.getTelemetry();
    this.initNotifData();
  }

  accept(notification: GlobalNotification, event: MouseEvent) {
    let globalNotifs = {};
    let currentNotifs = this.sessionStorage.get(
      GlobalConstant.SESSION_STORAGE_NOTIFICATIONS
    )?.[this.currentUser];
    if (currentNotifs) {
      globalNotifs[this.currentUser] = [...currentNotifs, notification.name];
    } else {
      globalNotifs[this.currentUser] = [notification.name];
    }
    notification.accepted = true;
    this.sessionStorage.set(
      GlobalConstant.SESSION_STORAGE_NOTIFICATIONS,
      globalNotifs
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
    // todo enable the version checking in 5.3
    // if (
    //   this.telemetryStatus?.max_upgrade_version.tag &&
    //   this.isUpgradeNeeded(
    //     this.telemetryStatus.current_version,
    //     this.telemetryStatus.max_upgrade_version.tag
    //   )
    // ) {
    //   this.globalNotifications.push({
    //     name: 'newVersionAvailable',
    //     message: this.tr.instant('login.UPGRADE_AVAILABLE', {
    //       currentVersion: this.telemetryStatus.current_version,
    //       newVersion: this.telemetryStatus.max_upgrade_version.tag,
    //     }),
    //     link: '',
    //     labelClass: 'warning',
    //     accepted: false,
    //     unClamped: false,
    //   });
    // }
    if (this.unUpdateDays > GlobalConstant.MAX_UNUPDATED_DAYS) {
      this.globalNotifications.push({
        name: 'isScannerOld',
        message: this.tr.instant('login.CVE_DB_OLD', {
          day: Math.round(this.unUpdateDays),
        }),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: false,
        unClamped: false,
      });
    }
    if (this.isVersionMismatch) {
      this.globalNotifications.push({
        name: 'isVersionMismatch',
        message: this.tr.instant('login.VERSION_MISMATCHED'),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: false,
        unClamped: false,
      });
    }
    if (this.passwordExpiration >= 0 && this.passwordExpiration < 10) {
      this.globalNotifications.push({
        name: 'isPasswordExpiring',
        message: this.tr.instant('login.CHANGE_EXPIRING_PASSWORD', {
          expiring_Days: this.passwordExpiration + 1,
        }),
        link: '#/profile',
        labelClass: this.passwordExpiration < 1 ? 'danger' : 'warning',
        accepted: false,
        unClamped: false,
      });
    }
    if (
      GlobalVariable.user.token.default_password &&
      GlobalVariable.user.token.server.toLowerCase() !== 'rancher'
    ) {
      this.globalNotifications.push({
        name: 'isDefaultPassword',
        message: this.tr.instant('login.CHANGE_DEFAULT_PASSWORD'),
        link: '#/profile',
        labelClass: 'warning',
        accepted: false,
        unClamped: false,
      });
    }
    if (
      this.rbacData.clusterrole_errors &&
      this.rbacData.clusterrole_errors.length > 0
    ) {
      this.rbacData.clusterrole_errors.forEach(err => {
        this.globalNotifications.push({
          name: 'clusterrole_errors:' + err,
          message: err,
          link: '',
          labelClass: 'danger',
          accepted: false,
          unClamped: false,
        });
      });
    }
    if (
      this.rbacData.clusterrolebinding_errors &&
      this.rbacData.clusterrolebinding_errors.length > 0
    ) {
      this.rbacData.clusterrolebinding_errors.forEach(err => {
        this.globalNotifications.push({
          name: 'clusterrolebinding_errors:' + err,
          message: err,
          link: '',
          labelClass: 'danger',
          accepted: false,
          unClamped: false,
        });
      });
    }
    if (
      this.rbacData.rolebinding_errors &&
      this.rbacData.rolebinding_errors.length > 0
    ) {
      this.rbacData.rolebinding_errors.forEach(err => {
        this.globalNotifications.push({
          name: 'rolebinding_errors:' + err,
          message: err,
          link: '',
          labelClass: 'danger',
          accepted: false,
          unClamped: false,
        });
      });
    }
    if (this.rbacData.role_errors && this.rbacData.role_errors.length > 0) {
      this.rbacData.role_errors.forEach(err => {
        this.globalNotifications.push({
          name: 'role_errors:' + err,
          message: err,
          link: '',
          labelClass: 'danger',
          accepted: false,
          unClamped: false,
        });
      });
    }
    if (
      this.rbacData.neuvector_crd_errors &&
      this.rbacData.neuvector_crd_errors.length > 0
    ) {
      this.rbacData.neuvector_crd_errors.forEach(err => {
        this.globalNotifications.push({
          name: 'neuvector_crd_errors:' + err,
          message: err,
          link: '',
          labelClass: 'danger',
          accepted: false,
          unClamped: false,
        });
      });
    }
    const notifs: string[] =
      this.sessionStorage.get(GlobalConstant.SESSION_STORAGE_NOTIFICATIONS)?.[
        this.currentUser
      ] || [];
    if (notifs && notifs.length > 0) {
      this.globalNotifications.forEach(globalNotif => {
        if (notifs.includes(globalNotif.name)) {
          globalNotif.accepted = true;
        }
      });
    } else {
      this.sessionStorage.remove(GlobalConstant.SESSION_STORAGE_NOTIFICATIONS);
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

  getRbacTitle(name: string) {
    return this.tr.instant(
      'dashboard.body.message.' + name.split(':')[0].toUpperCase()
    );
  }
}
