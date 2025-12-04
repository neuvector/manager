import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkRulesComponent } from './network-rules.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { AgGridModule } from 'ag-grid-angular';
import { NgChartsModule } from 'ng2-charts';
import { ActionButtonsComponent } from './partial/action-buttons/action-buttons.component';
import { AddEditNetworkRuleModalComponent } from './partial/add-edit-network-rule-modal/add-edit-network-rule-modal.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { MoveNetworkRulesModalComponent } from './partial/move-network-rules-modal/move-network-rules-modal.component';
import { FromToCellComponent } from './partial/from-to-cell/from-to-cell.component';
import { PipeModule } from '@common/pipes/pipe.module';
import { IdCellComponent } from './partial/id-cell/id-cell.component';
import { PortsCellComponent } from './partial/ports-cell/ports-cell.component';
import { PortsFullListModalComponent } from './partial/ports-full-list-modal/ports-full-list-modal.component';
import { NetworkRulesPrintableReportComponent } from './partial/network-rules-printable-report/network-rules-printable-report.component';
import { NetworkRulesReportChartComponent } from './partial/network-rules-report-chart/network-rules-report-chart.component';
import { ConfirmDialogModule } from '@components/ui/confirm-dialog/confirm-dialog.module';

@NgModule({
  declarations: [
    NetworkRulesComponent,
    ActionButtonsComponent,
    AddEditNetworkRuleModalComponent,
    MoveNetworkRulesModalComponent,
    FromToCellComponent,
    IdCellComponent,
    PortsCellComponent,
    PortsFullListModalComponent,
    NetworkRulesPrintableReportComponent,
    NetworkRulesReportChartComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    NgChartsModule,
    QuickFilterModule,
    LoadingButtonModule,
    PipeModule,
    ConfirmDialogModule,
    AgGridModule,
    // AgGridModule.withComponents([
    //   ActionButtonsComponent,
    //   IdCellComponent,
    //   FromToCellComponent,
    //   PortsCellComponent
    // ]),
  ],
  exports: [NetworkRulesComponent],
})
export class NetworkRulesModule {}
