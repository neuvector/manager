import { Component, OnInit } from '@angular/core';
import { CommonHttpService } from '@common/api/common-http.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalNotification } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-global-notifications',
  templateUrl: './global-notifications.component.html',
  styleUrls: ['./global-notifications.component.scss'],
})
export class GlobalNotificationsComponent implements OnInit {
  globalNotifications: GlobalNotification[] = [];
  version: any;
  unUpdateDays!: number;
  get isVersionMismatch() {
    return (
      (GlobalVariable.summary.component_versions.length > 1 &&
        GlobalVariable.summary.component_versions[0] ===
          GlobalVariable.summary.component_versions[1]) ||
      this.version !== GlobalVariable.summary.component_versions[0]
    );
  }
  get passwordExpiration() {
    return GlobalVariable.user.token.password_days_until_expire;
  }
  get notificationLength() {
    return this.globalNotifications.filter(n => !n.accepted).length;
  }

  constructor(
    private tr: TranslateService,
    private commonHttpService: CommonHttpService
  ) {}

  ngOnInit(): void {
    this.initNotifData();
  }

  accept(notification: GlobalNotification) {
    notification.accepted = true;
  }

  initNotifData(): void {
    if (GlobalVariable.hasInitializedSummary && GlobalVariable.user) {
      this.getVersion();
      this.unUpdateDays = this.getUnUpdateDays();
      this.generateNotifications();
    } else {
      setTimeout(() => this.initNotifData());
    }
  }

  generateNotifications(): void {
    if (this.unUpdateDays > GlobalConstant.MAX_UNUPDATED_DAYS) {
      this.globalNotifications.push({
        name: 'isScannerOld',
        message: this.tr.instant('login.CVE_DB_OLD', {
          day: Math.round(this.unUpdateDays),
        }),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: false,
      });
    }
    if (this.isVersionMismatch) {
      this.globalNotifications.push({
        name: 'isVersionMismatch',
        message: this.tr.instant('login.VERSION_MISMATCHED'),
        link: '#/controllers',
        labelClass: 'warning',
        accepted: false,
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
      });
    }
    if (GlobalVariable.user.token.default_password) {
      this.globalNotifications.push({
        name: 'isDefaultPassword',
        message: this.tr.instant(
          GlobalVariable.user.token.server.toLowerCase() === 'rancher'
            ? 'login.CHANGE_DEFAULT_PASSWORD_RANCHER'
            : 'login.CHANGE_DEFAULT_PASSWORD'
        ),
        link: '#/profile',
        labelClass: 'warning',
        accepted: false,
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

  getVersion() {
    this.commonHttpService.getVersion().subscribe({
      next: version => {
        this.version = version;
      },
    });
  }
}
