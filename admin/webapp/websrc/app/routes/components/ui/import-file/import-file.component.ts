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
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { HttpResponse } from '@angular/common/http';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'app-import-file',
  templateUrl: './import-file.component.html',
  styleUrls: ['./import-file.component.scss'],
})
export class ImportFileComponent implements OnInit, OnChanges {
  @Input() importUrl: string = '';
  @Input() isStandAlone?: boolean; //Only for system config file import
  @Input() alias: string = '';
  uploader!: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;
  response: string = "";
  percentage: number = 0;
  status: string = '';
  nvToken: string = '';
  errMsg: string = '';

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    public translate: TranslateService
  ) {
    this.nvToken = this.sessionStorage.get(
      GlobalConstant.SESSION_STORAGE_TOKEN
    ).token.token;
  }

  ngOnInit(): void {
    this.uploader = new FileUploader({
      url: this.importUrl,
      queueLimit: 1,
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
      return function (fileItem, response: string, status, headers) {
        let errObj = JSON.parse(response);
        self.errMsg = self.utils.getAlertifyMsg(errObj.message, self.translate.instant('setting.IMPORT_FAILED'), false);
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

  ngOnChanges(changes: SimpleChanges): void {
    if (
      typeof this.uploader !== 'undefined' &&
      typeof this.isStandAlone !== 'undefined'
    ) {
      this.addOrReplaceHeaders('X-As-Standalone', this.isStandAlone);
    }
  }

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
      // Alertify.set({ delay: 8000 });
      // Alertify.success(
      //   $translate.instant("admissionControl.msg.IMPORT_FINISH")
      // );
      setTimeout(() => {
        //ToDo: If from configuration, logout else close parent modal
      }, 1000);
    } else {
      // this.status = Utils.getAlertifyMsg(this.status, this.translate.instant("admissionControl.msg.IMPORT_FAILED"), false);
      // Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
      // Alertify.error(
      //   $scope.status
      // );
    }
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
      console.log('headers', headers);
      GlobalVariable.http
        .post(this.importUrl, tempToken, {
          headers: headers,
          observe: 'response',
        })
        .subscribe(
          (res: HttpResponse<any>) => {
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
          err => {
            console.warn(err);
            this.status = this.utils.getAlertifyMsg(
              err,
              this.translate.instant('admissionControl.msg.IMPORT_FAILED'),
              false
            );
            if (!MapConstant.USER_TIMEOUT.includes(err.status)) {
              // Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              // Alertify.error(
              //   this.status
              // );
            }
          }
        );
    }
  };

  public fileOverBase = (e: any): void => {
    this.hasBaseDropZoneOver = e;
  };
}
