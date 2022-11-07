import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { RegistriesTableComponent } from '../registries-table.component';
import { FormGroup } from '@angular/forms';
import { AddRegistryFieldConfig } from './add-registry-form-configs';
import { cloneDeep } from 'lodash';
import { INTERVAL_STEP_VALUES } from './add-registry-form-configs/constants/constants';
import {
  AWSKey,
  ErrorResponse,
  GCRKey,
  RegistryConfig,
  RegistryPostBody,
  ScanSchedule,
} from '@common/types';
import { RegistriesService } from '@services/registries.service';
import { finalize, switchMap, take } from 'rxjs/operators';
import { TestSettingsDialogComponent } from './test-connection-dialog/test-settings-dialog.component';
import { RegistriesCommunicationService } from '../../regestries-communication.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'app-add-registry-dialog',
  templateUrl: './add-registry-dialog.component.html',
  styleUrls: ['./add-registry-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRegistryDialogComponent implements OnInit, AfterViewChecked {
  maskFieldWhenEdit = '********';
  form = new FormGroup({});
  model: any = {};
  fields = cloneDeep(AddRegistryFieldConfig);
  submittingForm = false;
  canTestConnectionTypes = ['Docker Registry', 'JFrog Artifactory'];
  canTestConnection!: boolean;
  saving$ = this.registriesCommunicationService.saving$;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<RegistriesTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistryConfig,
    private registriesService: RegistriesService,
    private registriesCommunicationService: RegistriesCommunicationService,
    private notificationService: NotificationService
  ) {}

  submit(): void {
    if (this.form.valid) {
      this.registriesCommunicationService.initSave();
      let body!: RegistryPostBody;
      const schedule: ScanSchedule = { schedule: 'manual', interval: 0 };
      let aws_key: AWSKey | undefined;
      let gcr_key: GCRKey | undefined;
      const {
        auto_scan,
        periodic_scan,
        interval,
        access_key_id,
        secret_access_key,
        id,
        region,
        json_key,
        ...formValue
      } = this.form.value;
      if (periodic_scan) {
        schedule.schedule = 'periodical';
        schedule.interval = INTERVAL_STEP_VALUES[interval].value;
      }
      if (auto_scan) {
        schedule.schedule = 'auto';
        schedule.interval = 300;
      }
      if (id && region) {
        aws_key = {
          secret_access_key,
          access_key_id,
          id,
          region,
        };
        body = {
          config: { ...formValue, schedule, aws_key },
        };
      } else if (json_key) {
        gcr_key = {
          json_key,
        };
        body = {
          config: { ...formValue, schedule, gcr_key },
        };
      } else {
        body = {
          config: { ...formValue, schedule },
        };
      }
      if (!body.config.auth_with_token) {
        body.config.auth_with_token = false;
      }
      body.config.cfg_type = this.model.isFed
        ? GlobalConstant.CFG_TYPE.FED
        : GlobalConstant.CFG_TYPE.CUSTOMER;
      this.submittingForm = true;
      if (this.model?.isEdit) {
        body.config.password =
          body.config.password !== this.maskFieldWhenEdit
            ? body.config.password
            : undefined;
        body.config.registry_type = this.model.registry_type;
        body.config.name = this.model.name;
        this.registriesService
          .patchRegistry({ wrap: body, name: body.config.name })
          .pipe(
            take(1),
            finalize(() => {
              this.submittingForm = false;
            })
          )
          .subscribe({
            complete: () => {
              this.registriesCommunicationService.refreshRegistries();
              this.saving$.subscribe(saving => {
                if (!saving) {
                  this.dialogRef.close();
                }
              });
            },
            error: ({ error }: { error: ErrorResponse }) => {
              this.registriesCommunicationService.cancelSave();
              this.notificationService.open(error.message);
            },
          });
      } else {
        this.registriesService
          .postRegistry(body)
          .pipe(
            finalize(() => {
              this.submittingForm = false;
            })
          )
          .subscribe({
            complete: () => {
              this.registriesCommunicationService.refreshRegistries();
              this.saving$.subscribe(saving => {
                if (!saving) {
                  this.dialogRef.close();
                }
              });
            },
            error: ({ error }: { error: ErrorResponse }) => {
              this.registriesCommunicationService.cancelSave();
              this.notificationService.open(error.message);
            },
          });
      }
    }
  }

  ngOnInit(): void {
    if (this.data) {
      const { schedule, ...data } = this.data;
      const interval =
        Object.keys(INTERVAL_STEP_VALUES).find(
          key => INTERVAL_STEP_VALUES[key].value === schedule.interval
        ) || 0;
      let periodic_scan = false;
      let auto_scan = false;
      switch (schedule.schedule) {
        case 'auto': {
          auto_scan = true;
          break;
        }
        case 'periodical': {
          periodic_scan = true;
          break;
        }
      }
      this.model = {
        ...data,
        isEdit: true,
        isFed: data.cfg_type === GlobalConstant.CFG_TYPE.FED,
        password: this.maskFieldWhenEdit,
        auto_scan,
        periodic_scan,
        interval,
      };
    }
  }

  ngAfterViewChecked(): void {
    this.canTestConnection = this.canTestConnectionTypes.includes(
      this.form.controls?.registry_type?.value
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openTestConnectionDialog(): void {
    const dialog = this.dialog.open(TestSettingsDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: this.model,
      disableClose: true,
    });

    dialog.afterClosed().subscribe((filters: string[]) => {
      if (filters.length) {
        this.form.controls.filters.setValue(filters);
      }
    });
  }
}
