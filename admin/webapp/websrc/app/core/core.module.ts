import { NgModule, Optional, SkipSelf } from '@angular/core';

import { SwitchersService } from './switchers/switchers.service';
import { ThemesService } from './themes/themes.service';
import { TranslatorService } from './translator/translator.service';
import { MenuService } from './menu/menu.service';
import { HttpInterceptorProviders } from './interceptor/index';
import { MultiClusterService } from '@services/multi-cluster.service';

import { throwDuplicatedInstance } from './singleInstanceModule';

@NgModule({
  imports: [],
  providers: [
    SwitchersService,
    ThemesService,
    TranslatorService,
    MenuService,
    HttpInterceptorProviders,
    MultiClusterService,
  ],
  declarations: [],
  exports: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() superModule: CoreModule) {
    throwDuplicatedInstance(superModule, 'CoreModule');
  }
}
