import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './global-notifications.component';
import { NvCommonModule } from '@common/nvCommon.module';

@NgModule({
  declarations: [GlobalNotificationsComponent],
  imports: [CommonModule, NvCommonModule],
  exports: [GlobalNotificationsComponent],
})
export class GlobalNotificationsModule {}
