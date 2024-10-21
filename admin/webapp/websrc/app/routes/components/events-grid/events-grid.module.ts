import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsGridComponent } from './events-grid.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { QuickFilterModule } from '@components/quick-filter/quick-filter.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { AgGridModule } from 'ag-grid-angular';
import { EventsGridNameCellComponent } from './events-grid-name-cell/events-grid-name-cell.component';
import { EventsGridLevelCellComponent } from './events-grid-level-cell/events-grid-level-cell.component';
import { EventsGridUserCellComponent } from './events-grid-user-cell/events-grid-user-cell.component';
import { EventsGridMessageCellComponent } from './events-grid-message-cell/events-grid-message-cell.component';
import { EventsGridLocationCellComponent } from './events-grid-location-cell/events-grid-location-cell.component';
import { EventsGridFilterComponent } from './events-grid-filter/events-grid-filter.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { EventsGridFilterService } from './events-grid.filter.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EventsGridCsvService } from './csv-generation/events-grid-csv.service';

@NgModule({
  declarations: [
    EventsGridComponent,
    EventsGridNameCellComponent,
    EventsGridLevelCellComponent,
    EventsGridUserCellComponent,
    EventsGridMessageCellComponent,
    EventsGridLocationCellComponent,
    EventsGridFilterComponent,
  ],
  providers: [EventsGridFilterService, EventsGridCsvService],
  imports: [
    CommonModule,
    NvCommonModule,
    QuickFilterModule,
    LoadingButtonModule,
    NgxSliderModule,
    DragDropModule,
    AgGridModule
    // AgGridModule.withComponents([]),
  ],
  exports: [EventsGridComponent],
})
export class EventsGridModule {}
