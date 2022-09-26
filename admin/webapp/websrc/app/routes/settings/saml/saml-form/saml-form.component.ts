import { Component, Input, OnInit } from '@angular/core';
import {
  ErrorResponse,
  GroupMappedRole,
  SAML,
  ServerGetResponse,
  ServerPatchBody,
} from '@common/types';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { urlValidator } from '@common/validators';
import { getCallbackUri } from '../../common/helpers';

@Component({
  selector: 'app-saml-form',
  templateUrl: './saml-form.component.html',
  styleUrls: ['./saml-form.component.scss'],
})
export class SamlFormComponent implements OnInit {
  @Input() samlData!: { server: ServerGetResponse; domains: string[] };
  submittingForm = false;
  errorMessage = '';
  groupMappedRoles: GroupMappedRole[] = [];
  serverName = 'saml1';
  passwordVisible = false;
  samlRedirectURL!: string;
  samlForm = new FormGroup({
    sso_url: new FormControl(null, [Validators.required, urlValidator()]),
    issuer: new FormControl(null, [Validators.required, urlValidator()]),
    x509_cert: new FormControl(null, [Validators.required]),
    group_claim: new FormControl(),
    default_role: new FormControl(),
    enable: new FormControl(false),
  });

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.samlRedirectURL = getCallbackUri('token_auth_server');
    const saml = this.samlData.server.servers.find(
      ({ server_type }) => server_type === 'ldap'
    );
    if (saml && saml.saml) {
      this.serverName = saml.server_name;
      this.groupMappedRoles = saml.saml.group_mapped_roles;
      Object.keys(saml.saml).forEach((key: string) => {
        if (this.samlForm.controls[key]) {
          this.samlForm.controls[key].setValue(
            saml.saml ? saml.saml[key] : null
          );
        }
      });
    }
  }

  updateGroupMappedRoles(newGroupMappedRoles: GroupMappedRole[]): void {
    this.groupMappedRoles = newGroupMappedRoles;
  }

  submitForm(): void {
    if (!this.samlForm.valid) {
      return;
    }
    const saml: SAML = {
      group_mapped_roles: this.groupMappedRoles,
      ...this.samlForm.value,
    };
    const config: ServerPatchBody = { config: { name: this.serverName, saml } };
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
}
