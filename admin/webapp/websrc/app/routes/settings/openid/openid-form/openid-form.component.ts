import { Component, Input, OnInit } from '@angular/core';
import {
  ErrorResponse,
  GroupMappedRole,
  OPENID,
  ServerGetResponse,
  ServerPatchBody,
} from '@common/types';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '@services/settings.service';
import { getCallbackUri } from '../../common/helpers';
import { finalize } from 'rxjs/operators';
import { urlValidator } from '@common/validators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-openid-form',
  templateUrl: './openid-form.component.html',
  styleUrls: ['./openid-form.component.scss'],
})
export class OpenidFormComponent implements OnInit {
  @Input() openidData!: { server: ServerGetResponse; domains: string[] };
  submittingForm = false;
  errorMessage = '';
  groupMappedRoles: GroupMappedRole[] = [];
  serverName = 'openId1';
  passwordVisible = false;
  openidRedirectURL!: string;

  openidForm = new FormGroup({
    issuer: new FormControl(null, [Validators.required, urlValidator()]),
    client_id: new FormControl(null, Validators.required),
    client_secret: new FormControl(null, Validators.required),
    group_claim: new FormControl(),
    default_role: new FormControl(),
    enable: new FormControl(false),
  });
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  scopes: string[] = ['openid', 'profile', 'email'];

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.openidRedirectURL = getCallbackUri('openId_auth ');
    const openid = this.openidData.server.servers.find(
      ({ server_type }) => server_type === 'ldap'
    );
    if (openid && openid.openid) {
      this.serverName = openid.server_name;
      this.groupMappedRoles = openid.openid.group_mapped_roles;
      Object.keys(openid.openid).forEach((key: string) => {
        if (this.openidForm.controls[key]) {
          this.openidForm.controls[key].setValue(
            openid.openid ? openid.openid[key] : null
          );
        }
      });
    }
  }

  updateGroupMappedRoles(newGroupMappedRoles: GroupMappedRole[]): void {
    this.groupMappedRoles = newGroupMappedRoles;
  }

  submitForm(): void {
    if (!this.openidForm.valid) {
      return;
    }
    const oidc: OPENID = {
      scopes: this.scopes,
      group_mapped_roles: this.groupMappedRoles,
      ...this.openidForm.value,
    };
    const config: ServerPatchBody = { config: { name: this.serverName, oidc } };
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

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.scopes.push(value);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  remove(scope: string): void {
    const index = this.scopes.indexOf(scope);

    if (index >= 0) {
      this.scopes.splice(index, 1);
    }
  }
}
