import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { AgGridModule } from 'ag-grid-angular';
import { DlpSensorsComponent } from './dlp-sensors.component';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { PipeModule } from '@common/pipes/pipe.module';
import { SensorActionButtonsComponent } from './partial/sensor-action-buttons/sensor-action-buttons.component';
import { RuleActionButtonsComponent } from './partial/rule-action-buttons/rule-action-buttons.component';
import { AddEditSensorModalComponent } from './partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { AddEditRuleModalComponent } from './partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { PatternActionButtonsComponent } from './partial/pattern-action-buttons/pattern-action-buttons.component';
import { ImportFileModalModule } from '@components/ui/import-file-modal/import-file-modal.module';
import { ExportOptionsModalModule } from '@components/export-options-modal/export-options-modal.module';

const routes: Routes = [
  { path: '', component: DlpSensorsComponent },
  { path: '*', redirectTo: '' },
];

@NgModule({
  declarations: [
    DlpSensorsComponent,
    SensorActionButtonsComponent,
    RuleActionButtonsComponent,
    AddEditSensorModalComponent,
    AddEditRuleModalComponent,
    PatternActionButtonsComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    AdjustableDivModule,
    QuickFilterModule,
    PipeModule,
    LoadingButtonModule,
    ImportFileModalModule,
    RouterModule.forChild(routes),
    AgGridModule.withComponents([
      SensorActionButtonsComponent,
      RuleActionButtonsComponent,
    ]),
    ExportOptionsModalModule,
  ],
})
export class DlpSensorsModule {}
