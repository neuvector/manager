import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { RbacWarningModalComponent } from './rbac-warning-modal.component';



@NgModule({
  declarations: [
    RbacWarningModalComponent
  ],
  imports: [
    CommonModule,
    NvCommonModule
  ],
  exports: [
    RbacWarningModalComponent
  ]
})
export class RbacWarningModalModule { }
