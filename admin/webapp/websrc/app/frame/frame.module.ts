import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { FrameComponent } from './frame.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { NavsearchComponent } from './header/navsearch/navsearch.component';
import { FooterComponent } from './footer/footer.component';

import { NvCommonModule } from '@common/nvCommon.module';
import { GlobalNotificationsModule } from '@components/global-notifications/global-notifications.module';

import { provideHttpClient } from '@angular/common/http';
import { AvatarModule } from 'ngx-avatars';
import { NotifierModule, NotifierOptions } from 'angular-notifier';
import { PipeModule } from '@common/pipes/pipe.module';
import { CustomFooterComponent } from './custom-footer/custom-footer.component';
import { CustomHeaderComponent } from './custom-header/custom-header.component';

const customNotifierOptions: NotifierOptions = {
  position: {
    horizontal: {
      position: 'right',
      distance: 12,
    },
    vertical: {
      position: 'bottom',
      distance: 12,
      gap: 10,
    },
  },
  theme: 'material',
  behaviour: {
    autoHide: 10000,
    onClick: 'hide',
    onMouseover: 'pauseAutoHide',
    showDismissButton: true,
    stacking: 4,
  },
  animations: {
    enabled: true,
    show: {
      preset: 'slide',
      speed: 300,
      easing: 'ease',
    },
    hide: {
      preset: 'fade',
      speed: 300,
      easing: 'ease',
      offset: 50,
    },
    shift: {
      speed: 300,
      easing: 'ease',
    },
    overlap: 150,
  },
};

@NgModule({
  imports: [
    NvCommonModule,
    MatDividerModule,
    GlobalNotificationsModule,
    AvatarModule,
    NotifierModule.withConfig(customNotifierOptions),
    PipeModule,
  ],
  providers: [
    provideHttpClient()
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
