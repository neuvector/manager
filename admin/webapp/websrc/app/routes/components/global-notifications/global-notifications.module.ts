import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './global-notifications.component';
import { NvCommonModule } from '@common/nvCommon.module';
import { CspLicenseConfigModalComponent } from './csp-license-config-modal/csp-license-config-modal.component';
import { LoadingButtonModule } from '@components/ui/loading-button/loading-button.module';

@NgModule({
  declarations: [GlobalNotificationsComponent, CspLicenseConfigModalComponent],
  imports: [CommonModule, NvCommonModule, LoadingButtonModule],
  exports: [GlobalNotificationsComponent],
})
export class GlobalNotificationsModule {}
