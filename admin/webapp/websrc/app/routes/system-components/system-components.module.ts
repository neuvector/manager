import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemComponentsComponent } from './system-components.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { RouterModule, Routes } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { SystemComponentsCommunicationService } from './system-components-communication.service';
import { LoadingTemplateModule } from '@components/ui/loading-template/loading-template.module';
import { EnforcersGridModule } from '@components/enforcers-grid/enforcers-grid.module';
import { AdjustableDivModule } from '@components/ui/adjustable-div/adjustable-div.module';
import { EnforcerDetailsComponent } from './enforcer-details/enforcer-details.component';
import { NgChartsModule } from 'ng2-charts';
import { ScannersGridModule } from '@components/scanners-grid/scanners-grid.module';
import { ScannerDetailsComponent } from './scanner-details/scanner-details.component';
import { ControllersGridModule } from '@components/controllers-grid/controllers-grid.module';
import { ControllerDetailsComponent } from './controller-details/controller-details.component';
import { ContainerStatsModule } from '@components/container-stats/container-stats.module';

const routes: Routes = [{ path: '', component: SystemComponentsComponent }];

@NgModule({
  declarations: [
    SystemComponentsComponent,
    EnforcerDetailsComponent,
    ScannerDetailsComponent,
    ControllerDetailsComponent,
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    RouterModule.forChild(routes),
    LoadingTemplateModule,
    AdjustableDivModule,
    NgChartsModule,
    EnforcersGridModule,
    ScannersGridModule,
    ControllersGridModule,
    ContainerStatsModule,
  ],
  providers: [SystemComponentsCommunicationService],
})
export class SystemComponentsModule {}
