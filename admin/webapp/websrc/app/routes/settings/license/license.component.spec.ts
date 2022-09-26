import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LicenseComponent } from './license.component';
import { SettingsService } from '@services/settings.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import * as axe from 'axe-core';

describe('LicenseComponent', () => {
  let component: LicenseComponent;
  let fixture: ComponentFixture<LicenseComponent>;

  const mockSettingsService = jasmine.createSpyObj<SettingsService>(
    'SettingsService',
    ['getLicense']
  );
  mockSettingsService.getLicense.and.returnValue(of());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenseComponent],
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: SettingsService, useValue: mockSettingsService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LicenseComponent);
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
