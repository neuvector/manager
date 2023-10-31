import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerDetailComponent } from './container-detail.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [ContainerDetailComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    TranslateModule,
  ],
  exports: [ContainerDetailComponent],
})
export class ContainerDetailModule {}
