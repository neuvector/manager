import {
  Component,
  Inject,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { TranslateService } from '@ngx-translate/core';
import { AdmissionConfigurationAssessment } from '@common/types/admission/admission';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-import-test-file',
  templateUrl: './import-test-file.component.html',
  styleUrls: ['./import-test-file.component.scss'],
})
export class ImportTestFileComponent implements OnInit {
  @Input() importUrl: string = '';
  @Input() isStandAlone?: boolean; //Only for system config file import
  @Input() alias: string = '';
  @Output() getImportResult =
    new EventEmitter<AdmissionConfigurationAssessment>();
  uploader!: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;
  response: string = '';
  percentage: number = 0;
  status: string = '';
  nvToken: string = '';
  result: any;
  errMsg: string = '';

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {
    this.nvToken = this.localStorage.get(
      GlobalConstant.LOCAL_STORAGE_TOKEN
    ).token.token;
  }

  ngOnInit(): void {
    this.uploader = new FileUploader({
      url: this.importUrl,
      queueLimit: 2,
      itemAlias: this.alias,
      headers: [
        { name: 'Token', value: this.nvToken },
        { name: 'Accept', value: 'application/octet-stream' },
      ],
      disableMultipart: false, // 'DisableMultipart' must be 'true' for formatDataFunction to be called.
      formatDataFunctionIsAsync: false,
      formatDataFunction: (item: FileItem) => item._file,
    });

    this.hasBaseDropZoneOver = false;
    this.hasAnotherDropZoneOver = false;

    this.response = '';

    let self = this;

    this.uploader.response.subscribe(
      res => {
        console.log(res);
      },
      error => {
        console.error(error);
      }
    );

    this.uploader.onSuccessItem = (function (self: any) {
      return function (fileItem, response: string, status, headers) {
        self.status = 'done';
        self.percentage = 100;
        self.getImportResult.emit(JSON.parse(response));
      };
    })(self);

    this.uploader.onErrorItem = (function (self: any) {
      return function (fileItem, response: string, status, headers) {
        let errObj = JSON.parse(response);
        self.errMsg = self.utils.getAlertifyMsg(
          errObj.message,
          self.translate.instant('admissionControl.msg.IMPORT_FAILED'),
          false
        );
        self.percentage = 0;
        if (!MapConstant.USER_TIMEOUT.includes(status)) {
          self.notificationService.open(
            self.errMsg,
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      };
    })(self);
  }

  browseFile = () => {
    this.uploader?.clearQueue();
    this.percentage = 0;
  };

  public fileOverBase = (e: any): void => {
    if (this.uploader?.queue.length > 1) this.uploader?.queue.shift();
    this.percentage = 0;
    this.hasBaseDropZoneOver = e;
  };
}
