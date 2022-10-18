import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSelectorDropdownComponent } from './multi-selector-dropdown.component';
import { NvCommonModule } from '@common/nvCommon.module';



@NgModule({
  declarations: [
    MultiSelectorDropdownComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule
  ],
  exports: [
    MultiSelectorDropdownComponent
  ]
})
export class MultiSelectorDropdownModule { }
