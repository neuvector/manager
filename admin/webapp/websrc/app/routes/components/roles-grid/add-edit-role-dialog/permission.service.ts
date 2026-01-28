import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Permission, PermissionOption, Role } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

export interface PermissionDialogOption extends PermissionOption {
  displayName: string;
  desc: string;
}

@Injectable()
export class PermissionService {
  private defaultPermission = (): PermissionDialogOption => ({
    id: '',
    read_supported: false,
    write_supported: false,
    displayName: '',
    desc: '',
  });
  permissionOptions = {
    authentication: this.defaultPermission(),
    authorization: this.defaultPermission(),
    config: this.defaultPermission(),
    rt_scan: this.defaultPermission(),
    reg_scan: this.defaultPermission(),
    ci_scan: this.defaultPermission(),
    rt_policy: this.defaultPermission(),
    admctrl: this.defaultPermission(),
    vulnerability: this.defaultPermission(),
    compliance: this.defaultPermission(),
    audit_events: this.defaultPermission(),
    security_events: this.defaultPermission(),
    events: this.defaultPermission(),
  };

  constructor(
    private fb: FormBuilder,
    private tr: TranslateService
  ) {}

  loadPermissions(permissionOptions) {
    permissionOptions.forEach(permissionOption => {
      if (this.permissionOptions.hasOwnProperty(permissionOption.id)) {
        const PID = permissionOption.id.toUpperCase();
        this.permissionOptions[permissionOption.id] = {
          ...permissionOption,
          displayName: this.tr.instant('role.permissions.' + PID),
          desc: this.tr.instant('role.permissions.description.' + PID),
        };
      }
    });
  }

  buildPermissionsForm() {
    let permissionsForm = this.fb.group({});
    Object.keys(this.permissionOptions).forEach(permission =>
      permissionsForm.addControl(
        permission,
        this.fb.group({
          read: [false],
          write: [false],
        })
      )
    );
    return permissionsForm;
  }

  formatRoleForm(role: Role) {
    return {
      ...role,
      permissions: role.permissions.reduce((obj, item) => {
        obj[item.id] = item;
        return obj;
      }, {}),
    };
  }

  formatRoleChips(role: Role) {
    return role.permissions.map(permission => ({
      name: this.getChipName(permission),
      value: { ...permission },
    }));
  }

  getChipName(permission: Permission): string {
    const permissionText = this.tr.instant(
      'role.permissions.' + permission.id.toUpperCase()
    );
    const modifier = permission.write ? 'M' : 'V';
    return `${permissionText} (${modifier})`;
  }

  isPermissionOption = (permissionOption: PermissionDialogOption) => {
    return (
      permissionOption.id &&
      permissionOption.displayName &&
      permissionOption.desc
    );
  };
}
