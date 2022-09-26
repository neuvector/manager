import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LicenseRenewComponent } from './license-renew.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import * as axe from 'axe-core';

describe('LicenseRenewComponent', () => {
  let component: LicenseRenewComponent;
  let fixture: ComponentFixture<LicenseRenewComponent>;

  const mockSettingsService = jasmine.createSpyObj('SettingsService', [
    'renewLicense',
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenseRenewComponent],
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: SettingsService, useValue: mockSettingsService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LicenseRenewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass accessibility test', done => {
    axe.run(fixture.nativeElement, (err, result) => {
      expect(result.violations.length).toBe(0);
      done();
    });
  });
});
