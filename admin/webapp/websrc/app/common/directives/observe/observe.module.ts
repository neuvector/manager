import { NgModule } from '@angular/core';
import { ObserveDirective } from '@common/directives/observe/observe.directive';

@NgModule({
  declarations: [ObserveDirective],
  exports: [ObserveDirective],
})
export class ObserveModule {}
