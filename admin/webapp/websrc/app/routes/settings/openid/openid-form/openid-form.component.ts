import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
import { TranslateService } from '@ngx-translate/core';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  standalone: false,
  selector: 'app-openid-form',
  templateUrl: './openid-form.component.html',
  styleUrls: ['./openid-form.component.scss'],
})
export class OpenidFormComponent implements OnInit, OnChanges {
  @Input() openidData!: { server: ServerGetResponse; domains: string[] };
  @Output() refresh = new EventEmitter();
  isCreated = true;
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
    default_role: new FormControl(''),
    enable: new FormControl(false),
    authorization_endpoint: new FormControl({ value: null, disabled: true }),
    token_endpoint: new FormControl({ value: null, disabled: true }),
    user_info_endpoint: new FormControl({ value: null, disabled: true }),
  });
  isWriteOidcAuthorized!: boolean;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  scopes: string[] = ['openid', 'profile', 'email'];

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private authUtilsService: AuthUtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.openidRedirectURL = getCallbackUri('openId_auth');
    this.isWriteOidcAuthorized =
      this.authUtilsService.getDisplayFlag('write_auth_server');
    if (!this.isWriteOidcAuthorized) {
      this.openidForm.disable();
    }
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.openidData && !changes.openidData.isFirstChange()) {
      this.openidForm.reset();
      this.initForm();
    }
  }

  initForm(): void {
    const openid = this.openidData.server.servers.find(
      ({ server_type }) => server_type === 'oidc'
    );
    if (openid && openid.oidc) {
      this.serverName = openid.server_name;
      this.groupMappedRoles = openid.oidc.group_mapped_roles || [];
      this.scopes = openid.oidc.scopes || [];
      Object.keys(openid.oidc).forEach((key: string) => {
        if (this.openidForm.controls[key]) {
          this.openidForm.controls[key].setValue(
            openid.oidc ? openid.oidc[key] : null
          );
        }
      });
      let client_secret = this.openidForm.get('client_secret');
      client_secret?.clearValidators();
      client_secret?.updateValueAndValidity();
      client_secret?.markAsPristine();
    } else {
      this.isCreated = false;
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
      group_mapped_roles: this.groupMappedRoles || [],
      ...this.openidForm.value,
    };
    if (!this.openidForm.get('client_secret')?.dirty) {
      oidc.client_secret = null as any;
    }
    const config: ServerPatchBody = { config: { name: this.serverName, oidc } };
    this.submittingForm = true;
    let submission: Observable<unknown>;
    if (!this.isCreated) {
      submission = this.settingsService.postServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.refresh.emit();
        })
      );
    } else {
      submission = this.settingsService.patchServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.openidForm.reset(this.openidForm.getRawValue());
        })
      );
    }
    submission.subscribe({
      complete: () => {
        this.isCreated = true;
        this.notificationService.open(this.tr.instant('ldap.SERVER_SAVED'));
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.tr.instant('openId.LOAD_ERR')
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

  removable(scope: string): boolean {
    return scope !== 'openid';
  }
}
