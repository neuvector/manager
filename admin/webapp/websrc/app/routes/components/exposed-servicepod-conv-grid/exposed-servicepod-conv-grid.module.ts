import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExposedServicepodConvGridComponent } from './exposed-servicepod-conv-grid.component';
import { ExposedServicePodGridModule } from '@components/exposed-service-pod-grid/exposed-service-pod-grid.module';
import { ExposedServicepodGridServicepodCellComponent } from './exposed-servicepod-grid-servicepod-cell/exposed-servicepod-grid-servicepod-cell.component';
import { ExternalHostCellComponent } from './external-host-cell/external-host-cell.component';
import { FlagIpFqdnModule } from '@components/ui/flag-ip-fqdn/flag-ip-fqdn.module';
import { ConversationEntryListComponent } from './conversation-entry-list/conversation-entry-list.component';

@NgModule({
  declarations: [
    ExposedServicepodConvGridComponent,
    ExposedServicepodGridServicepodCellComponent,
    ExternalHostCellComponent,
    ConversationEntryListComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FlagIpFqdnModule,
    AgGridModule,
    // AgGridModule.withComponents([ExposedServicepodGridServicepodCellComponent]),
  ],
  exports: [ExposedServicepodConvGridComponent],
})
export class ExposedServicepodConvGridModule {}
