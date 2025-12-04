import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PermissionOption } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-permission-checkbox',
  templateUrl: './permission-checkbox.component.html',
  styleUrls: ['./permission-checkbox.component.scss'],
})
export class PermissionCheckboxComponent implements OnInit {
  @Input() permissionForm!: FormGroup;
  @Input() permissionOption!: PermissionOption;
  @Output() updatePermission = new EventEmitter();
  get read() {
    return this.permissionForm.controls.read;
  }
  get write() {
    return this.permissionForm.controls.write;
  }

  constructor() {}

  ngOnInit(): void {
    if (!this.permissionOption.read_supported) {
      this.permissionForm.controls.read.disable();
    }
    if (!this.permissionOption.write_supported) {
      this.permissionForm.controls.write.disable();
    }
  }

  readChanged(event: MatCheckboxChange) {
    if (!event.checked && this.write.value) {
      this.read.setValue(true);
    } else {
      this.updatePermission.emit(this.permissionForm.value);
    }
  }

  writeChanged(event: MatCheckboxChange) {
    if (event.checked && !this.read.disabled && !this.read.value) {
      this.read.setValue(true);
    }
    this.updatePermission.emit(this.permissionForm.value);
  }
}
