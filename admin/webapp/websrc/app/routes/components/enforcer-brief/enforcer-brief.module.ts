import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnforcerBriefComponent } from './enforcer-brief.component';
import { EnforcerBriefDialogComponent } from './enforcer-brief-dialog/enforcer-brief-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';



@NgModule({
  declarations: [
    EnforcerBriefComponent,
    EnforcerBriefDialogComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    TranslateModule,
    MatButtonModule,
    DragDropModule,
  ],
  exports: [EnforcerBriefComponent, EnforcerBriefDialogComponent],
})
export class EnforcerBriefModule { }
