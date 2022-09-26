import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickFilterComponent } from './quick-filter.component';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';

@NgModule({
  declarations: [QuickFilterComponent],
  imports: [CommonModule, MatInputModule, ReactiveFormsModule, TranslateModule],
  providers: [QuickFilterService],
  exports: [QuickFilterComponent],
})
export class QuickFilterModule {}
