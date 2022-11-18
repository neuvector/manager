import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { FrameComponent } from './frame.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { NavsearchComponent } from './header/navsearch/navsearch.component';
import { FooterComponent } from './footer/footer.component';

import { NvCommonModule } from '@common/nvCommon.module';
import { GlobalNotificationsModule } from '@components/global-notifications/global-notifications.module';

import { HttpClientModule } from '@angular/common/http';
import { AvatarModule } from 'ngx-avatar';
import { NotifierModule, NotifierOptions } from 'angular-notifier';

const customNotifierOptions: NotifierOptions = {
  position: {
		horizontal: {
			position: 'right',
			distance: 12
		},
		vertical: {
			position: 'bottom',
			distance: 12,
			gap: 10
		}
	},
  theme: 'material',
  behaviour: {
    autoHide: 10000,
    onClick: 'hide',
    onMouseover: 'pauseAutoHide',
    showDismissButton: true,
    stacking: 4
  },
  animations: {
    enabled: true,
    show: {
      preset: 'slide',
      speed: 300,
      easing: 'ease'
    },
    hide: {
      preset: 'fade',
      speed: 300,
      easing: 'ease',
      offset: 50
    },
    shift: {
      speed: 300,
      easing: 'ease'
    },
    overlap: 150
  }
};


@NgModule({
  imports: [
    NvCommonModule,
    MatDividerModule,
    GlobalNotificationsModule,
    HttpClientModule,
    AvatarModule,
    NotifierModule.withConfig(customNotifierOptions),
  ],
  providers: [],
  declarations: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
  ],
  exports: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
  ],
})
export class FrameModule {}
