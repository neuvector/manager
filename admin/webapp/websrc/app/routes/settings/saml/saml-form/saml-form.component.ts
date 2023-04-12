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
  SAMLPatch,
  ServerGetResponse,
  ServerPatchBody,
} from '@common/types';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { urlValidator } from '@common/validators';
import { getCallbackUri } from '../../common/helpers';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthUtilsService } from '@common/utils/auth.utils';

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
    x509_certs: new FormArray([], [Validators.maxLength(4)]),
    group_claim: new FormControl(),
    default_role: new FormControl(''),
    enable: new FormControl(false),
  });
  isWriteSamlAuthorized!: boolean;
  get x509_certs() {
    return this.samlForm.get('x509_certs') as FormArray;
  }

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private authUtilsService: AuthUtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.samlRedirectURL = getCallbackUri('token_auth_server');
    this.isWriteSamlAuthorized =
      this.authUtilsService.getDisplayFlag('write_auth_server');
    if (!this.isWriteSamlAuthorized) {
      this.samlForm.disable();
    }
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.samlData) {
      this.samlForm.reset();
      this.initForm();
    }
  }

  initForm(): void {
    this.x509_certs.clear();
    const saml = this.samlData.server.servers.find(
      ({ server_type }) => server_type === 'saml'
    );
    if (saml && saml.saml) {
      this.serverName = saml.server_name;
      this.groupMappedRoles = saml.saml.group_mapped_roles;
      saml.saml.x509_certs.forEach((x509_cert, idx) => {
        this.x509_certs.push(
          new FormControl(
            x509_cert.x509_cert,
            idx === 0 ? [Validators.required] : null
          )
        );
      });
      Object.keys(saml.saml).forEach((key: string) => {
        if (this.samlForm.controls[key] && key !== 'x509_certs') {
          this.samlForm.controls[key].setValue(
            saml.saml ? saml.saml[key] : null
          );
        }
      });
    } else {
      this.isCreated = false;
    }
    if (!this.x509_certs.length) {
      this.x509_certs.push(new FormControl('', [Validators.required]));
    }
  }

  updateGroupMappedRoles(newGroupMappedRoles: GroupMappedRole[]): void {
    this.groupMappedRoles = newGroupMappedRoles;
  }

  submitForm(): void {
    if (!this.samlForm.valid) {
      return;
    }
    const { x509_certs, ...samlForm } = this.samlForm.value;
    const saml: SAMLPatch = {
      group_mapped_roles: this.groupMappedRoles,
      x509_cert: x509_certs[0],
      x509_cert_extra: x509_certs.slice(1).filter(cert => cert),
      ...samlForm,
    };
    const config: ServerPatchBody = { config: { name: this.serverName, saml } };
    this.submittingForm = true;
    let submission: Observable<unknown>;
    if (!this.isCreated) {
      submission = this.settingsService.postServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.isCreated = true;
          this.refresh.emit();
        })
      );
    } else {
      submission = this.settingsService.patchServer(config).pipe(
        finalize(() => {
          this.submittingForm = false;
          this.samlForm.reset(this.samlForm.getRawValue());
        })
      );
    }
    submission.subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('ldap.SERVER_SAVED'));
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.tr.instant('okta.LOAD_ERR')
        );
      },
    });
  }

  addExtraCert() {
    this.x509_certs.push(new FormControl(''));
  }

  removeExtraCert(index: number) {
    this.x509_certs.removeAt(index);
  }
}
