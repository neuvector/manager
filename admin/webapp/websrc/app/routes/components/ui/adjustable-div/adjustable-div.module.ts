import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdjustableDivComponent,
  ContainerOneDirective,
  ContainerTwoDirective,
} from './adjustable-div.component';

@NgModule({
  declarations: [
    AdjustableDivComponent,
    ContainerOneDirective,
    ContainerTwoDirective,
  ],
  imports: [CommonModule],
  exports: [
    AdjustableDivComponent,
    ContainerOneDirective,
    ContainerTwoDirective,
  ],
})
export class AdjustableDivModule {}
