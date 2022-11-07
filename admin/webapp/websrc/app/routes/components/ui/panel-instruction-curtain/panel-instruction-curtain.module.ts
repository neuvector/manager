import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { PanelInstructionCurtainComponent } from './panel-instruction-curtain.component';



@NgModule({
  declarations: [
    PanelInstructionCurtainComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule
  ],
  exports: [
    PanelInstructionCurtainComponent
  ]
})
export class PanelInstructionCurtainModule { }
