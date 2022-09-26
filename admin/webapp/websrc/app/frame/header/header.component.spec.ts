/* tslint:disable:no-unused-variable */

import { Injector } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

import { SwitchersService } from '../../core/switchers/switchers.service';
import { MenuService } from '../../core/menu/menu.service';
import { TranslatorService } from '../../core/translator/translator.service';
import { createTranslateLoader } from '../../app.module';
import { SESSION_STORAGE } from 'ngx-webstorage-service';

describe('Component: Header', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    let store = {};
    const mockSessionStorage = {
      get: (key: string): string => {
        return key in store ? store[key] : null;
      },
      set: (key: string, value: string) => {
        store[key] = `${value}`;
      },
      remove: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient],
          },
        }),
        HttpClientModule,
      ],
      providers: [
        MenuService,
        SwitchersService,
        TranslatorService,
        Injector,
        { provide: SESSION_STORAGE, useValue: mockSessionStorage },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
