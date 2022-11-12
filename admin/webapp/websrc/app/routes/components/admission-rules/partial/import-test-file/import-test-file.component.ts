import {
  Component,
  Inject,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  FileUploader,
  FileItem,
} from 'ng2-file-upload';
import { GlobalConstant } from '@common/constants/global.constant';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { TranslateService } from '@ngx-translate/core';
import { AdmissionConfigurationAssessment } from '@common/types/admission/admission';

@Component({
  selector: 'app-import-test-file',
  templateUrl: './import-test-file.component.html',
  styleUrls: ['./import-test-file.component.scss'],
})
export class ImportTestFileComponent implements OnInit {
  @Input() importUrl: string = "";
  @Input() isStandAlone?: boolean; //Only for system config file import
  @Input() alias: string = "";
  @Output() getImportResult = new EventEmitter<AdmissionConfigurationAssessment>();
  uploader!: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;
  response: string = "";
  percentage: number = 0;
  status: string = "";
  nvToken: string = "";
  result: any;

  constructor(
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
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
        { name: 'Accept', value: 'application/octet-stream' }
      ],
      disableMultipart: false, // 'DisableMultipart' must be 'true' for formatDataFunction to be called.
      formatDataFunctionIsAsync: false,
      formatDataFunction: (item: FileItem) => item._file,
    });

    this.hasBaseDropZoneOver = false;
    this.hasAnotherDropZoneOver = false;

    this.response = '';

    let self = this;

    this.uploader.onSuccessItem = (function (self: any) {
      return function (fileItem, response: string, status, headers) {
        self.status = "done";
        self.percentage = 100;
        self.getImportResult.emit(JSON.parse(response));
      };
    })(self);

    // this.uploader.response.subscribe( res => {
    //   console.log(res)
    // } );
  }

  public fileOverBase = (e: any): void => {
    this.hasBaseDropZoneOver = e;
  };
}
