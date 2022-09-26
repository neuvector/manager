import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingButtonComponent } from './loading-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [LoadingButtonComponent],
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  exports: [LoadingButtonComponent],
})
export class LoadingButtonModule {}
