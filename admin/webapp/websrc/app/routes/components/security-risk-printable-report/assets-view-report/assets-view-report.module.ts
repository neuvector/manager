import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { AssetsViewReportComponent } from './assets-view-report.component';
import { RisksViewReportModule } from '@components/security-risk-printable-report/risks-view-report/risks-view-report.module';
import { AssetsViewReportAssetsTablesComponent } from './assets-view-report-assets-tables/assets-view-report-assets-tables.component';
import { AssetsViewReportAssetsPodsTableComponent } from './assets-view-report-assets-pods-table/assets-view-report-assets-pods-table.component';
import { AssetsViewReportAssetsNodesTableComponent } from './assets-view-report-assets-nodes-table/assets-view-report-assets-nodes-table.component';
import { AssetsViewReportAssetsPlatformsTableComponent } from './assets-view-report-assets-platforms-table/assets-view-report-assets-platforms-table.component';
import { AssetsViewReportAssetsImagesTableComponent } from './assets-view-report-assets-images-table/assets-view-report-assets-images-table.component';
import { PipeModule } from '@common/pipes/pipe.module';

@NgModule({
  declarations: [
    AssetsViewReportComponent,
    AssetsViewReportAssetsTablesComponent,
    AssetsViewReportAssetsPodsTableComponent,
    AssetsViewReportAssetsNodesTableComponent,
    AssetsViewReportAssetsPlatformsTableComponent,
    AssetsViewReportAssetsImagesTableComponent,
  ],
  imports: [CommonModule, NvCommonModule, RisksViewReportModule, PipeModule],
  exports: [AssetsViewReportComponent],
})
export class AssetsViewReportModule {}
