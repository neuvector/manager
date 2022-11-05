import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { AdmissionRulesComponent } from './admission-rules.component';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { AddEditAdmissionRuleModalComponent } from './partial/add-edit-admission-rule-modal/add-edit-admission-rule-modal.component';
import { AdvanceSettingModalComponent } from './partial/advance-setting-modal/advance-setting-modal.component';
import { ExportAdmissionRulesModalComponent } from './partial/export-admission-rules-modal/export-admission-rules-modal.component';
import { ConfigurationAssessmentModalComponent } from './partial/configuration-assessment-modal/configuration-assessment-modal.component';
import { ImportFileModalModule } from '@components/ui/import-file-modal/import-file-modal.module';
import { ConfirmDialogModule } from "@components/ui/confirm-dialog/confirm-dialog.module";
import { AgGridModule } from 'ag-grid-angular';
import { QuickFilterModule } from "@components/quick-filter/quick-filter.module";
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { FileUploadModule } from "ng2-file-upload";
import { ImportTestFileComponent } from "@components/admission-rules/partial/import-test-file/import-test-file.component";
import { PipeModule } from "@common/pipes/pipe.module";
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { CriterionDescriptionIconComponent } from './partial/criterion-description-icon/criterion-description-icon.component'
import { MultiSelectorDropdownModule } from '@routes/components/ui/multi-selector-dropdown/multi-selector-dropdown.module';
import { ConfigurationAssessmentResultPrintableReportComponent } from './partial/configuration-assessment-result-printable-report/configuration-assessment-result-printable-report.component';


@NgModule({
  declarations: [
    AdmissionRulesComponent,
    ActionButtonsComponent,
    AddEditAdmissionRuleModalComponent,
    AdvanceSettingModalComponent,
    ExportAdmissionRulesModalComponent,
    ConfigurationAssessmentModalComponent,
    ImportTestFileComponent,
    CriterionDescriptionIconComponent,
    ConfigurationAssessmentResultPrintableReportComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    LoadingTemplateModule,
    FileUploadModule,
    PipeModule,
    ClipboardModule,
    MatTooltipModule,
    NgJsonEditorModule,
    MultiSelectorDropdownModule,
    AgGridModule.withComponents([
      ActionButtonsComponent
    ])
  ],
  exports: [
    AdmissionRulesComponent
  ],
})
export class AdmissionRulesModule {}
