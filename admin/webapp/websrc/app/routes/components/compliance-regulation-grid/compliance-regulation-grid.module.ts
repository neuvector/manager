import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceRegulationGridComponent } from './compliance-regulation-grid.component';
import { ComplianceRegulationGridDialogComponent } from './compliance-regulation-grid-dialog/compliance-regulation-grid-dialog.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PipeModule } from '@common/pipes/pipe.module';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [
    ComplianceRegulationGridComponent,
    ComplianceRegulationGridDialogComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    AgGridModule,
    MatDialogModule,
    TranslateModule,
    MatButtonModule,
    DragDropModule,
    PipeModule,
  ],
  exports: [
    ComplianceRegulationGridComponent,
    ComplianceRegulationGridDialogComponent,
  ],
})
export class ComplianceRegulationGridModule {}
