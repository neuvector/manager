import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permission, PermissionOption, Role } from '@common/types';
import { Subject } from 'rxjs';
import { RolesGridComponent } from '../roles-grid.component';
import { PermissionService } from './permission.service';

export interface AddEditRoleDialog {
  isEdit: boolean;
  permissionOptions: PermissionOption[];
  role?: Role;
}

@Component({
  standalone: false,
  selector: 'app-add-edit-role-dialog',
  templateUrl: './add-edit-role-dialog.component.html',
  styleUrls: ['./add-edit-role-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditRoleDialogComponent implements OnInit {
  form!: FormGroup;
  saving$ = new Subject();
  permissionCtrl = new FormControl();
  permissionChips: { name: string; value: Permission }[] = [];
  get permissionOptions() {
    return this.permissionService.permissionOptions;
  }
  get dialogPrefix() {
    return this.data.isEdit ? 'edit' : 'add';
  }

  @ViewChild('permissionInput') permissionInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RolesGridComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditRoleDialog,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      comment: [''],
      permissions: this.permissionService.buildPermissionsForm(),
    });
    this.permissionService.loadPermissions(this.data.permissionOptions);
    if (this.data.isEdit && this.data.role) {
      const roleForm = this.permissionService.formatRoleForm(this.data.role);
      this.form.patchValue(roleForm);
      this.permissionChips = this.permissionService.formatRoleChips(
        this.data.role
      );
      this.form.controls['name'].disable();
    }
  }

  getPermissionForm(id: string) {
    return this.form.get(['permissions', id]) as FormGroup;
  }

  getRole(): Role {
    const permissions = this.permissionChips.map(c => c.value);
    permissions.forEach(permission => {
      permission.read ??= false;
      permission.write ??= false;
    });
    return {
      name: this.form.get('name')?.value,
      comment: this.form.get('comment')?.value,
      permissions,
    };
  }

  remove(permission: Permission): void {
    this.removeChip(permission);
    const permissionForm = this.getPermissionForm(permission.id);
    permissionForm.patchValue({
      read: false,
      write: false,
    });
    permissionForm.markAsDirty();
  }

  removeChip(permission: Permission): void {
    this.permissionChips = this.permissionChips.filter(
      chip => chip.value.id !== permission.id
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  @Output() confirm = new EventEmitter<Role>();
  submit(): void {
    this.saving$.next(true);
    this.confirm.emit(this.getRole());
  }

  updatePermission(permission: Omit<Permission, 'id'>, id: string) {
    const p: Permission = { ...permission, id: id };
    this.removeChip(p);
    if (permission.read || permission.write) {
      this.permissionChips.push({
        name: this.permissionService.getChipName(p),
        value: p,
      });
    }
  }

  isPermissionOption(p) {
    return this.permissionService.isPermissionOption(p);
  }

  unsorted(a: KeyValue<any, any>, b: KeyValue<any, any>): number {
    return 0;
  }
}
