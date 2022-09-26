import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PodBriefComponent } from './pod-brief.component';
import { PodBriefDialogComponent } from './pod-brief-dialog/pod-brief-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NvCommonModule } from '@common/nvCommon.module';




@NgModule({
  declarations: [
    PodBriefComponent,
    PodBriefDialogComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule,
    MatDialogModule,
    TranslateModule,
    MatButtonModule,
    DragDropModule,
  ],
  exports: [PodBriefComponent, PodBriefDialogComponent],
})
export class PodBriefModule { }
