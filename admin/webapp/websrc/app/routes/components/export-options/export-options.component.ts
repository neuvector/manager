import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SettingsService } from '@services/settings.service';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  selector: 'app-export-options',
  templateUrl: './export-options.component.html',
  styleUrls: ['./export-options.component.scss'],
})
export class ExportOptionsComponent implements OnInit {
  @Input() exportOptions: FormGroup | undefined;
  @Input() exportFileName: string | undefined;
  @Input() source: string;

  exportOptionsForm!: FormGroup;
  remoteRepoEnabled = false;
  isShowingUserRef = true;
  useNameRef = false;

  constructor(
    private fb: FormBuilder,
    private settingService: SettingsService
  ) {}

  ngOnInit(): void {
    this.exportOptionsForm = this.fb.group({
      policy_mode: '',
      profile_mode: '',
      export_mode: ['local'],
      use_name_referral: this.useNameRef,
      remote_repository_nickname: ['default'],
      file_path: [this.exportFileName],
      comment: [''],
    });
    this.isShowingUserRef =
      !this.exportFileName ||
      ![
        GlobalConstant.REMOTE_EXPORT_FILENAME.RESPONSE_RULES,
        GlobalConstant.REMOTE_EXPORT_FILENAME.ADMISSION_RULES,
      ].includes(this.exportFileName);
    this.exportOptions?.addControl('export_options', this.exportOptionsForm);
    this.getRemoteRepositories();
  }

  getRemoteRepositories(): void {
    this.settingService
      .getConfig()
      .pipe(map(value => value.remote_repositories))
      .subscribe(value => {
        if (value && value.length > 0) {
          this.remoteRepoEnabled = value[0].enable;
        } else {
          this.remoteRepoEnabled = false;
        }
      });
  }

  toggleNameRef(event): void {
    this.useNameRef = !this.useNameRef;
    this.exportOptionsForm.controls.use_name_referral.setValue(this.useNameRef);
  }
}
