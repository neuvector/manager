import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NvCommonModule } from "@common/nvCommon.module";
import { ImportFileComponent } from "./import-file.component";
import { FileUploadModule } from "ng2-file-upload";
import { PipeModule } from "@common/pipes/pipe.module";



@NgModule({
  declarations: [
    ImportFileComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    PipeModule,
    FileUploadModule
  ],
  exports: [
    ImportFileComponent
  ]
})
export class ImportFileModule {}
