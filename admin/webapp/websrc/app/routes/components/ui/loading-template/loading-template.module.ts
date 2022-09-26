import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingTemplateComponent } from '@components/ui/loading-template/loading-template.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [LoadingTemplateComponent],
  imports: [CommonModule, MatProgressSpinnerModule, TranslateModule],
  exports: [LoadingTemplateComponent],
})
export class LoadingTemplateModule {}
