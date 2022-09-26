import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsComponent } from './events.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { EventsGridModule } from '@components/events-grid/events-grid.module';

const routes: Routes = [{ path: '', component: EventsComponent }];

@NgModule({
  declarations: [EventsComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    LoadingButtonModule,
    LoadingTemplateModule,
    EventsGridModule,
  ],
})
export class EventsModule {}
