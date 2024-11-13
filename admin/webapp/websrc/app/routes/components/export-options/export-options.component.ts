import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SettingsService } from '@services/settings.service';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

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

  constructor(
    private fb: FormBuilder,
    private settingService: SettingsService
  ) {}

  ngOnInit(): void {
    this.exportOptionsForm = this.fb.group({
      policy_mode: '',
      profile_mode: '',
      export_mode: ['local'],
      remote_repository_nickname: ['default'],
      file_path: [this.exportFileName],
      comment: [''],
    });

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
}
