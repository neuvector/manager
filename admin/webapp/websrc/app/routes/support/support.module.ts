import { NgModule } from '@angular/core';
import { SupportComponent } from './support.component';
import { RouterModule, Routes } from '@angular/router';
import { NvCommonModule } from '@common/nvCommon.module';

const routes: Routes = [
  {
    path: '',
    component: SupportComponent,
  },
];

@NgModule({
  declarations: [SupportComponent],
  imports: [RouterModule.forChild(routes), NvCommonModule],
  exports: [SupportComponent],
})
export class SupportModule {}
