import {
  Component,
  Inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { HttpResponse } from '@angular/common/http';
import { NotificationService } from '@services/notification.service';
import { ErrorResponse } from '@common/types';
import { Location } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  standalone: false,
  selector: 'app-import-file',
  templateUrl: './import-file.component.html',
  styleUrls: ['./import-file.component.scss'],
  
})
export class ImportFileComponent implements OnInit, OnChanges {
  @Input() importUrl: string = '';
  @Input() isStandAlone?: boolean; //Only for system config file import
  @Input() alias: string = '';
  @Input() msg!: { success: string; error: string };
  uploader!: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;
  response: string = '';
  percentage: number = 0;
  status: string = '';
  nvToken: string = '';
  errMsg: string = '';

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    public translate: TranslateService,
    private location: Location,
    private router: Router
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
    if (typeof this.isStandAlone !== 'undefined') {
      this.addOrReplaceHeaders('X-As-Standalone', this.isStandAlone);
      console.log(this.uploader.options.headers);
    }

    this.hasBaseDropZoneOver = false;
    this.hasAnotherDropZoneOver = false;

    this.response = '';

    let self = this;

    this.uploader.onSuccessItem = (function (self: any) {
      return function (fileItem, response, status, headers) {
        console.log(fileItem, response, status, headers);
        if (status === 200) {
          self.finishImport(response);
        } else if (status === 206) {
          let responseData = JSON.parse(response);
          console.log(responseData);
          let transactionId = responseData.data.tid;
          let tempToken = responseData.data.temp_token;
          self.percentage = responseData.data.percentage;
          self.status = responseData.data.status;

          self.getImportProgressInfo({
            transactionId,
            tempToken,
            percentage: self.percentage,
            isStandAlone: self.isStandAlone || false,
          });
        }
      };
    })(self);

    this.uploader.onErrorItem = (function (self: any) {
      return function (fileItem, response, status, headers) {
        let resp;
        try {
          resp = JSON.parse(response);
        } catch (e) {
          resp = response;
        }
        self.status = 'error';
        self.percentage = 0;
        self.errMsg = self.utils.getAlertifyMsg(
          resp.message,
          self.translate.instant('setting.IMPORT_FAILED'),
          false
        );
        if (!MapConstant.USER_TIMEOUT.includes(status)) {
          self.notificationService.open(
            self.errMsg,
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      };
    })(self);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      typeof this.uploader !== 'undefined' &&
      typeof this.isStandAlone !== 'undefined'
    ) {
      this.addOrReplaceHeaders('X-As-Standalone', this.isStandAlone);
    }
    if (changes.importUrl && this.uploader) {
      this.uploader.setOptions({ url: changes.importUrl.currentValue });
    }
  }

  browseFile = () => {
    this.uploader?.clearQueue();
    this.percentage = 0;
    this.status = '';
  };

  addOrReplaceHeaders = (headerName, headerValue) => {
    if (
      typeof this.uploader.options !== 'undefined' &&
      typeof this.uploader.options.headers !== 'undefined'
    ) {
      let index = this.uploader.options.headers.findIndex(
        header => header.name === headerName
      );
      if (index > -1) {
        this.uploader.options.headers.splice(index, 1, {
          name: headerName,
          value: headerValue.toString(),
        });
      } else {
        this.uploader.options.headers.push({
          name: headerName,
          value: headerValue.toString(),
        });
      }
    }
  };

  finishImport = res => {
    this.percentage = res.data.percentage;
    this.status = res.data.status;

    if (this.status === 'done') {
      console.log(this.importUrl);
      if (this.importUrl === PathConstant.SYSTEM_CONFIG_URL) {
        this.notificationService.open(
          this.translate.instant('setting.message.UPLOAD_FINISH')
        );
        setTimeout(() => {
          this.localStorage.set(
            GlobalConstant.LOCAL_STORAGE_ORIGINAL_URL,
            this.location.path()
          );
          this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_TOKEN);
          this.localStorage.remove(GlobalConstant.LOCAL_STORAGE_CLUSTER);
          this.router.navigate([GlobalConstant.PATH_LOGIN]);
        }, 8000);
      } else {
        this.notificationService.open(this.msg.success);
      }
    } else {
      this.notificationService.openError(this.msg.error, this.status);
    }
  };

  status4Tooltip = status => {
    return this.errMsg || status.replace(/&#34;/g, '"');
  };

  getImportProgressInfo = params => {
    let tempToken = params.tempToken;
    if (params.transactionId) {
      let headers = {
        Token: this.nvToken,
        'X-Transaction-Id': params.transactionId,
      };
      if (typeof params.isStandAlone !== 'undefined') {
        headers = Object.assign(
          {
            'X-As-Standalone': params.isStandAlone.toString(),
          },
          headers
        );
      }
      GlobalVariable.http
        .post(this.importUrl, tempToken, {
          headers: headers,
          observe: 'response',
        })
        .subscribe({
          next: (res: HttpResponse<any>) => {
            if (res.status === 200) {
              this.finishImport(res.body);
            } else if (res.status === 206) {
              let transactionId = res.body?.data.tid;
              this.percentage = res.body?.data.percentage;
              this.status = res.body?.data.status;
              this.getImportProgressInfo({
                transactionId,
                tempToken,
                percentage: this.percentage,
                isStandAlone: this.isStandAlone || false,
              });
            }
          },
          error: ({
            status,
            error,
          }: {
            status: number;
            error: ErrorResponse;
          }) => {
            console.warn(error);
            this.status = 'error';
            if (!MapConstant.USER_TIMEOUT.includes(status)) {
              if (this.msg.error)
                this.notificationService.openError(error, this.msg.error);
              this.errMsg = error.message || error.error;
            }
          },
        });
    }
  };

  public fileOverBase = (e: any): void => {
    if (this.uploader?.queue.length > 1) this.uploader?.queue.shift();
    this.percentage = 0;
    this.status = '';
    this.hasBaseDropZoneOver = e;
  };
}
