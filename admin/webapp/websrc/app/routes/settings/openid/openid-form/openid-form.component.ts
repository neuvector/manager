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
import { Observable } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-openid-form',
  templateUrl: './openid-form.component.html',
  styleUrls: ['./openid-form.component.scss'],
})
export class OpenidFormComponent implements OnInit {
  @Input() openidData!: { server: ServerGetResponse; domains: string[] };
  onCreate = true;
  submittingForm = false;
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

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

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
    } else {
      this.onCreate = false;
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
    let submission: Observable<unknown>;
    if (!this.onCreate) {
      submission = this.settingsService.postServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.onCreate = true;
        })
      );
    } else {
      submission = this.settingsService.patchServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      );
    }
    submission.subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('ldap.SERVER_SAVED'));
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.open(
          this.utils.getAlertifyMsg(
            error,
            this.tr.instant('openId.LOAD_ERR'),
            false
          )
        );
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
