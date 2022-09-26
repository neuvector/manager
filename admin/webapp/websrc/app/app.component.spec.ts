/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateModule } from '@ngx-translate/core';

import { CoreModule } from './core/core.module';
import { FrameModule } from './frame/frame.module';
import { NvCommonModule } from './common/nvCommon.module';
import { RoutesModule } from './routes/routes.module';
import { APP_BASE_HREF } from '@angular/common';

describe('App: NeuVector', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        TranslateModule.forRoot(),
        CoreModule,
        FrameModule,
        NvCommonModule,
        RoutesModule,
      ],
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
    });
  });

  it('should create the app', async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
