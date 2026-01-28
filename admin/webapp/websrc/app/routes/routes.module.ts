import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatorService } from '@core/translator/translator.service';
import { MenuService } from '@core/menu/menu.service';
import { NvCommonModule } from '@common/nvCommon.module';
import { PagesModule } from './pages/pages.module';
import { menu } from './menu';
import { routes } from './routes';

@NgModule({
  imports: [
    NvCommonModule,
    RouterModule.forRoot(routes, { useHash: true }),
    PagesModule,
  ],
  exports: [RouterModule],
  declarations: [],
  providers: [],
})
export class RoutesModule {
  constructor(
    public menuService: MenuService,
    tr: TranslatorService
  ) {
    menuService.addMenu(menu);
  }
}
