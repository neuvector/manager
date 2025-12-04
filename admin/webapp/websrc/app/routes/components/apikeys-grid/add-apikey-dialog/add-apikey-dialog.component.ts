import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  MatTableDataSource,
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
import { getNamespaceRoleGridData } from '@common/utils/common.utils';


interface AddApikeyDialog {
  globalRoles: string[];
  domainRoles: string[];
  domains: string[];
  isReadOnly?: boolean;
  apikey?: Apikey;
}

@Component({
  standalone: false,
  selector: 'app-add-apikey-dialog',
  templateUrl: './add-apikey-dialog.component.html',
  styleUrls: ['./add-apikey-dialog.component.scss'],
  
})
export class AddApikeyDialogComponent implements OnInit {
  expirationOptions: ApikeyExpiration[] = [
    'never',
    'onehour',
    'oneday',
    'onemonth',
    'oneyear',
    'hours',
  ];
  customExpUnit = this.utils.CALENDAR.HOURS;
  customExpUnits: string[] = [
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
  domainTableSource!: MatTableDataSource<any>;
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
  get domainTableEmpty(): boolean {
    return !this.domainTableSource.data.filter(
      ({ namespaces }) => namespaces.length
    ).length;
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
      this.data.apikey
        ? getNamespaceRoleGridData(
            this.data.domainRoles,
            this.data.apikey.role,
            JSON.parse(JSON.stringify(this.data.apikey.role_domains))
          )
        : getNamespaceRoleGridData(this.data.domainRoles)
    );
    this.activeRole = this.domainTableSource.data[0].namespaceRole;
    this.form = new FormGroup({
      apikey_name: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[\w-]{1,32}$/),
      ]),
      description: new FormControl(''),
      role: new FormControl(this.data.globalRoles[0]),
      expiration_type: new FormControl('onehour'),
      expiration_hours: new FormControl({ value: 0, disabled: true }, [
        Validators.pattern(/^[0-9]*$/),
        this.expirationValidator.bind(this),
      ]),
    });
    if (this.data.isReadOnly && this.data.apikey) {
      this.form.patchValue(this.data.apikey);
      this.form.disable();
    }
  }

  changeExpiration(selectedExpiration: ApikeyExpiration) {
    if (selectedExpiration === 'hours') {
      this.form.controls['expiration_hours'].enable();
    } else {
      this.form.controls['expiration_hours'].disable();
    }
  }

  changeExpUnit() {
    this.form.controls['expiration_hours'].updateValueAndValidity();
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
    } else {
      patch.expiration_hours = 0;
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

  private expirationValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    if (this.selectedExpiration !== 'hours') {
      return null;
    }
    const expHours = control.value;
    let error;
    switch (this.customExpUnit) {
      case this.utils.CALENDAR.MONTHS:
        if (expHours > 12) {
          error = { invalidHours: true };
        }
        break;
      case this.utils.CALENDAR.DAYS:
        if (expHours > 365) {
          error = { invalidHours: true };
        }
        break;
      case this.utils.CALENDAR.HOURS:
        if (expHours > 8760) {
          error = { invalidHours: true };
        }
        break;
    }
    return error || null;
  }
}
