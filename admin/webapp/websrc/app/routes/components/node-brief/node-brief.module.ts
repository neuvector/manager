import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeBriefComponent } from '@components/node-brief/node-brief.component';
import { NodeBriefDialogComponent } from '@components/node-brief/node-brief-dialog/node-brief-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [NodeBriefComponent, NodeBriefDialogComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    TranslateModule,
    MatButtonModule,
    DragDropModule,
  ],
  exports: [NodeBriefComponent, NodeBriefDialogComponent],
})
export class NodeBriefModule {}
