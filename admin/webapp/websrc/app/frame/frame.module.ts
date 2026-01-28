import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { FooterComponent } from './footer/footer.component';
import { FrameComponent } from './frame.component';
import { HeaderComponent } from './header/header.component';
import { NavsearchComponent } from './header/navsearch/navsearch.component';
import { SidebarComponent } from './sidebar/sidebar.component';

import { NvCommonModule } from '@common/nvCommon.module';
import { GlobalNotificationsModule } from '@components/global-notifications/global-notifications.module';

import { provideHttpClient } from '@angular/common/http';
import { PipeModule } from '@common/pipes/pipe.module';
import { AvatarModule } from 'ngx-avatars';
import { ToastrModule } from 'ngx-toastr';
import { CustomFooterComponent } from './custom-footer/custom-footer.component';
import { CustomHeaderComponent } from './custom-header/custom-header.component';

@NgModule({
  imports: [
    NvCommonModule,
    MatDividerModule,
    GlobalNotificationsModule,
    AvatarModule,
    PipeModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      timeOut: 10000,
      closeButton: true,
      progressBar: true,
      tapToDismiss: true,
      preventDuplicates: false,
      maxOpened: 4,
      autoDismiss: true,
    }),
  ],
  providers: [
    provideHttpClient(),
  ],
  declarations: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
    CustomFooterComponent,
    CustomHeaderComponent,
  ],
  exports: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
    CustomFooterComponent,
    CustomHeaderComponent,
  ],
})
export class FrameModule {}
