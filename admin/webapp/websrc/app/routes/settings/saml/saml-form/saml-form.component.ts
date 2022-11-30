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
  SAML,
  ServerGetResponse,
  ServerPatchBody,
} from '@common/types';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { urlValidator } from '@common/validators';
import { getCallbackUri } from '../../common/helpers';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-saml-form',
  templateUrl: './saml-form.component.html',
  styleUrls: ['./saml-form.component.scss'],
})
export class SamlFormComponent implements OnInit, OnChanges {
  @Input() samlData!: { server: ServerGetResponse; domains: string[] };
  @Output() refresh = new EventEmitter();
  isCreated = true;
  submittingForm = false;
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

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.samlRedirectURL = getCallbackUri('token_auth_server');
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.samlData) {
      this.initForm();
    }
  }

  initForm(): void {
    const saml = this.samlData.server.servers.find(
      ({ server_type }) => server_type === 'saml'
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
      let x509_cert = this.samlForm.get('x509_cert');
      x509_cert?.clearValidators();
      x509_cert?.markAsPristine();
    } else {
      this.isCreated = false;
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
    if (!this.samlForm.get('x509_cert')?.dirty) {
      saml.x509_cert = null as any;
    }
    const config: ServerPatchBody = { config: { name: this.serverName, saml } };
    this.submittingForm = true;
    let submission: Observable<unknown>;
    if (!this.isCreated) {
      submission = this.settingsService.postServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.isCreated = true;
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
        this.refresh.emit();
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.open(
          this.utils.getAlertifyMsg(
            error,
            this.tr.instant('okta.LOAD_ERR'),
            false
          )
        );
      },
    });
  }
}
