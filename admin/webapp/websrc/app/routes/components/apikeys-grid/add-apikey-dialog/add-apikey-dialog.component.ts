import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  MatTableDataSource,
  _MatTableDataSource,
} from '@angular/material/table';
import { Subject } from 'rxjs';
import { ApikeysGridComponent } from '../apikeys-grid.component';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  Apikey,
  ApikeyExpiration,
  ApikeyInit,
  ErrorResponse,
} from '@common/types';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';

interface AddApikeyDialog {
  globalRoles: string[];
  domainRoles: string[];
  domains: string[];
}

@Component({
  selector: 'app-add-apikey-dialog',
  templateUrl: './add-apikey-dialog.component.html',
  styleUrls: ['./add-apikey-dialog.component.scss'],
})
export class AddApikeyDialogComponent implements OnInit {
  expirationOptions: ApikeyExpiration[] = [
    'never',
    'oneday',
    'onemonth',
    'oneyear',
    'hours',
  ];
  customExpUnit = this.utils.CALENDAR.HOURS;
  customExpUnits: string[] = [
    this.utils.CALENDAR.YEARS,
    this.utils.CALENDAR.MONTHS,
    this.utils.CALENDAR.DAYS,
    this.utils.CALENDAR.HOURS,
  ];
  form!: FormGroup;
  saving$ = new Subject();
  apikeyInit!: ApikeyInit;
  toggleAdvSetting = false;
  get showAdvSetting() {
    const role = this.form.controls.role.value;
    return (
      (this.toggleAdvSetting || role === '') &&
      ![MapConstant.FED_ROLES.FEDADMIN, MapConstant.FED_ROLES.ADMIN].includes(
        role
      )
    );
  }
  domainTableSource!: _MatTableDataSource<any>;
  activeRole!: string;
  get isKube() {
    return GlobalVariable.summary
      ? GlobalVariable.summary.platform
          .toLowerCase()
          .includes(GlobalConstant.KUBE)
      : false;
  }
  get selectedRole(): string {
    return this.form.get('role')?.value;
  }
  get selectedExpiration(): ApikeyExpiration {
    return this.form.get('expiration_type')?.value;
  }
  get bearerToken(): string {
    return `${this.apikeyInit.apikey_name}:${this.apikeyInit.apikey_secret}`;
  }

  constructor(
    public dialogRef: MatDialogRef<ApikeysGridComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddApikeyDialog,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private tr: TranslateService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    if (!this.isKube) {
      let indexOfNone = this.data.globalRoles.findIndex(role => role === '');
      if (indexOfNone > -1) this.data.globalRoles.splice(indexOfNone, 1);
    }
    this.domainTableSource = new MatTableDataSource(
      this.data.domainRoles.map(domainRoleOption => ({
        namespaceRole: domainRoleOption,
        namespaces: [],
      }))
    );
    this.activeRole = this.domainTableSource.data[0].namespaceRole;
    this.form = new FormGroup({
      apikey_name: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[\w-]{1,32}$/),
      ]),
      description: new FormControl(''),
      role: new FormControl(this.data.globalRoles[0]),
      expiration_type: new FormControl('oneday'),
      expiration_hours: new FormControl(0),
    });
  }

  onNoClick(saved: boolean = false): void {
    this.dialogRef.close(saved);
  }

  @Output() confirm = new EventEmitter<Apikey>();
  submit(): void {
    this.saving$.next(true);
    const role_domains = this.domainTableSource.data
      .filter(({ namespaces }) => namespaces.length)
      .reduce((acc, role) => {
        const { namespaceRole, namespaces } = role;
        return { ...acc, [namespaceRole]: [...namespaces] };
      }, {});
    const patch: Apikey = {
      ...this.form.getRawValue(),
      role_domains,
    };
    if (patch.expiration_type === 'hours') {
      patch.expiration_hours = this.getHours(
        +patch.expiration_hours,
        this.customExpUnit
      );
    }
    this.settingsService
      .addApikey(patch)
      .pipe(finalize(() => this.saving$.next(false)))
      .subscribe({
        next: apikeyInit => {
          this.apikeyInit = apikeyInit;
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.onNoClick();
          this.notificationService.openError(
            error,
            this.tr.instant('apikey.msg.ADD_NG')
          );
        },
      });
  }

  private getHours(amount: number, unit: string): number {
    let ret = amount;
    switch (unit) {
      case this.utils.CALENDAR.YEARS:
        ret *= 8760;
        break;
      case this.utils.CALENDAR.MONTHS:
        ret *= 730;
        break;
      case this.utils.CALENDAR.DAYS:
        ret *= 24;
        break;
      case this.utils.CALENDAR.HOURS:
        break;
    }
    return ret;
  }
}
