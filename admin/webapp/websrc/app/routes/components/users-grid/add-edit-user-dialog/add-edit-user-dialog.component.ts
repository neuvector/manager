import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { User } from '@common/types';
import { passwordValidator } from '@common/validators';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslatorService } from '@core/translator/translator.service';
import { GroupDomainRoleTableComponent } from 'app/routes/settings/common/group-domain-role/group-domain-role-table/group-domain-role-table.component';
import { Subject } from 'rxjs';
import { UsersGridComponent } from '../users-grid.component';
import { getNamespaceRoleGridData } from '@common/utils/common.utils';

export interface AddEditUserDialog {
  isEdit: boolean;
  globalRoles: string[];
  domainRoles: string[];
  domains: string[];
  user?: User;
  isReadOnly?: boolean;
  isReset?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-add-edit-user-dialog',
  templateUrl: './add-edit-user-dialog.component.html',
  styleUrls: ['./add-edit-user-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditUserDialogComponent implements OnInit {
  form!: FormGroup;
  saving$ = new Subject();
  toggleAdvSetting = false;
  domainTableSource!: MatTableDataSource<any>;
  get showAdvSetting() {
    const role = this.form.controls.role.value;
    return (
      (this.toggleAdvSetting || role === '') &&
      ![MapConstant.FED_ROLES.FEDADMIN, MapConstant.FED_ROLES.ADMIN].includes(
        role
      )
    );
  }
  @ViewChild(GroupDomainRoleTableComponent)
  domainTable!: GroupDomainRoleTableComponent;
  get domainTableDirty() {
    return this.domainTable ? this.domainTable.dirty : false;
  }
  get isKube() {
    return GlobalVariable.summary
      ? GlobalVariable.summary.platform
          .toLowerCase()
          .includes(GlobalConstant.KUBE)
      : false;
  }
  get passwordForm(): FormGroup {
    return <FormGroup>this.form.get('passwordForm');
  }
  get selectedRole(): string {
    return this.form.get('role')?.value;
  }
  get languages(): { code: string; text: string }[] {
    return this.tr.getAvailableLanguages();
  }
  get dialogPrefix() {
    return this.data.isEdit
      ? 'edit'
      : this.data.isReset
        ? 'reset'
        : this.data.isReadOnly
          ? 'view'
          : 'add';
  }
  get domainTableEmpty(): boolean {
    return !this.domainTableSource.data.filter(
      ({ namespaces }) => namespaces.length
    ).length;
  }

  get rancherPermissions() {
    let rancherPermissions: any[] = [];
    rancherPermissions.push({
      namespaces: ['global'],
      permissions: this.data.user!.extra_permissions!,
    });
    this.data.user!.extra_permissions_domains?.forEach(entry => {
      rancherPermissions.push({
        namespaces: entry.domains,
        permissions: entry.permissions,
      });
    });
    return rancherPermissions;
  }

  get hasExtraPermissions() {
    if (this.data.isEdit) {
      return (
        (this.data.user!.extra_permissions &&
          Array.isArray(this.data.user!.extra_permissions) &&
          this.data.user!.extra_permissions.length > 0) ||
        (this.data.user!.extra_permissions_domains &&
          Array.isArray(this.data.user!.extra_permissions_domains) &&
          this.data.user!.extra_permissions_domains.length > 0)
      );
    } else {
      return false;
    }
  }

  get hasNamespaceRoles() {
    if (this.data.isEdit) {
      return (
        this.data.user!.role_domains &&
        Object.keys(this.data.user!.role_domains).length > 0
      );
    } else {
      return true;
    }
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UsersGridComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditUserDialog,
    private tr: TranslatorService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data.isReset) {
      this.form = this.fb.group({
        username: [
          { value: this.data.user?.username, disabled: true },
          Validators.required,
        ],
        loginReset: [false, Validators.required],
        passwordForm: this.fb.group(
          {
            newPassword: ['', Validators.required],
            confirmPassword: ['', Validators.required],
          },
          { validators: passwordValidator() }
        ),
      });
    } else {
      if (!this.isKube) {
        let indexOfNone = this.data.globalRoles.findIndex(role => role === '');
        if (indexOfNone > -1) this.data.globalRoles.splice(indexOfNone, 1);
      }
      this.domainTableSource = new MatTableDataSource(
        this.data.user
          ? getNamespaceRoleGridData(
              this.data.domainRoles,
              this.data.user.role,
              JSON.parse(JSON.stringify(this.data.user.role_domains))
            )
          : getNamespaceRoleGridData(this.data.domainRoles)
      );
      this.form = this.fb.group({
        username: ['', Validators.required],
        email: ['', Validators.email],
        role: [this.data.globalRoles[0]],
      });
      if (!this.data.isEdit) {
        this.form.addControl('locale', this.fb.control(this.languages[0].code));
        this.form.addControl('password', this.fb.control(''));
        this.form.addControl(
          'passwordForm',
          this.fb.group(
            {
              newPassword: ['', Validators.required],
              confirmPassword: ['', Validators.required],
            },
            { validators: passwordValidator() }
          )
        );
      } else {
        this.form.controls.username.disable();
        if (this.data.user) {
          this.form.patchValue({
            username: this.data.user.username,
            email: this.data.user.email,
            role: this.data.user.role,
          });
          if (this.data.user.fullname === 'admin') {
            this.form.controls.role.disable();
          }
          if (
            !this.data.user.role ||
            this.domainTableSource.data
              .map(r => {
                const namespaces: string[] = r.namespaces;
                return !!(Array.isArray(namespaces) && namespaces.length);
              })
              .includes(true)
          ) {
            this.toggleAdvSetting = true;
          }
          if (this.data.isReadOnly) {
            this.form.disable();
          }
        }
      }
    }
  }

  updateTable(): void {
    this.cd.detectChanges();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  @Output() confirm = new EventEmitter();
  submit(): void {
    this.saving$.next(true);
    const role_domains = this.domainTableSource.data
      .filter(({ namespaces }) => namespaces.length)
      .reduce((acc, role) => {
        const { namespaceRole, namespaces } = role;
        return { ...acc, [namespaceRole]: [...namespaces] };
      }, {});
    if (this.data.isEdit) {
      this.confirm.emit({
        ...this.data.user,
        ...this.form.getRawValue(),
        role_domains,
      });
    } else {
      this.confirm.emit({ ...this.form.value, role_domains });
    }
  }

  submitReset(): void {
    this.saving$.next(true);
    this.confirm.emit({ ...this.form.getRawValue() });
  }
}
