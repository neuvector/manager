import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { ContainerBriefComponent } from '@components/container-brief/container-brief.component';
import { ContainerBriefDialogComponent } from '@components/container-brief/container-brief-dialog/container-brief-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ContainerBriefComponent, ContainerBriefDialogComponent],
  imports: [
    CommonModule,
    NvCommonModule,
    MatDialogModule,
    TranslateModule,
    MatButtonModule,
    DragDropModule,
  ],
  exports: [ContainerBriefComponent, ContainerBriefDialogComponent],
})
export class ContainerBriefModule {}
