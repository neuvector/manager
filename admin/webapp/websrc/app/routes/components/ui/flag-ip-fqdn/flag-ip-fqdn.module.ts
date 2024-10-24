import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NvCommonModule } from '@common/nvCommon.module';
import { FlagIpFqdnComponent } from './flag-ip-fqdn.component';

@NgModule({
  declarations: [FlagIpFqdnComponent],
  imports: [CommonModule, NvCommonModule],
  exports: [FlagIpFqdnComponent],
})
export class FlagIpFqdnModule {}
