import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ErrorResponse,
  GroupMappedRole,
  LDAP,
  ServerGetResponse,
  ServerPatchBody,
} from '@common/types';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { TestConnectionDialogComponent } from '../test-connection-dialog/test-connection-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-ldap-form',
  templateUrl: './ldap-form.component.html',
  styleUrls: ['./ldap-form.component.scss'],
})
export class LdapFormComponent implements OnInit {
  @Input() ldapData!: { server: ServerGetResponse; domains: string[] };
  submittingForm = false;
  errorMessage = '';
  groupMappedRoles: GroupMappedRole[] = [];
  serverName = 'ldap1';
  passwordVisible = false;
  ldapForm = new FormGroup({
    directory: new FormControl(),
    hostname: new FormControl(null, Validators.required),
    port: new FormControl(),
    ssl: new FormControl(),
    bind_dn: new FormControl(),
    bind_password: new FormControl(),
    base_dn: new FormControl(null, Validators.required),
    username_attr: new FormControl(),
    group_member_attr: new FormControl(),
    default_role: new FormControl(),
    enable: new FormControl(false),
  });

  constructor(
    private settingsService: SettingsService,
    private dialog: MatDialog
  ) {}

  submitForm(): void {
    if (!this.ldapForm.valid) {
      return;
    }
    const ldap: LDAP = {
      group_mapped_roles: this.groupMappedRoles,
      ...this.ldapForm.value,
    };
    const config: ServerPatchBody = { config: { name: this.serverName, ldap } };
    this.submittingForm = true;
    this.errorMessage = '';
    this.settingsService
      .patchServer(config)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe({
        error: ({ error }: { error: ErrorResponse }) => {
          if (error.error && error.message) {
            this.errorMessage = `${error.error}: ${error.message}`;
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
        },
      });
  }

  ngOnInit(): void {
    const ldap = this.ldapData.server.servers.find(
      ({ server_type }) => server_type === 'ldap'
    );
    if (ldap && ldap.ldap) {
      this.serverName = ldap.server_name;
      this.groupMappedRoles = ldap.ldap.group_mapped_roles;
      Object.keys(ldap.ldap).forEach((key: string) => {
        if (this.ldapForm.controls[key]) {
          this.ldapForm.controls[key].setValue(
            ldap.ldap ? ldap.ldap[key] : null
          );
        }
      });
    }
  }

  openDialog(): void {
    const ldap: LDAP = {
      group_mapped_roles: this.groupMappedRoles,
      ...this.ldapForm.value,
    };
    this.dialog.open(TestConnectionDialogComponent, {
      width: '60%',
      data: {
        ldap,
        name: this.serverName,
      },
    });
  }

  updateGroupMappedRoles(newGroupMappedRoles: GroupMappedRole[]): void {
    this.groupMappedRoles = newGroupMappedRoles;
  }
}
