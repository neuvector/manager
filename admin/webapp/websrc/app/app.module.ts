import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // this is needed!
import { NgModule, Inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';

import { CoreModule } from '@core/core.module';
import { FrameModule } from './frame/frame.module';
import { NvCommonModule } from '@common/nvCommon.module';
import { RoutesModule } from './routes/routes.module';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export class WindowWrapper extends Window {}

export function getWindow() {
  return window;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    HttpClientModule,
    BrowserAnimationsModule,
    CoreModule,
    FrameModule,
    NvCommonModule.forRoot(),
    RoutesModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [{ provide: WindowWrapper, useFactory: getWindow }],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    w: WindowWrapper,
    http: HttpClient,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService
  ) {
    GlobalVariable.window = w;
    GlobalVariable.http = http;
    this.localStorage.set(
      GlobalConstant.LOCAL_STORAGE_EXTERNAL_REF,
      location.hash
    );
  }
}
