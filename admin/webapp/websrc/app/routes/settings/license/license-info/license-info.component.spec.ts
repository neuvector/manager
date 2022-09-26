import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LicenseInfoComponent } from './license-info.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import * as axe from 'axe-core';

describe('LicenseInfoComponent', () => {
  let component: LicenseInfoComponent;
  let fixture: ComponentFixture<LicenseInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenseInfoComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LicenseInfoComponent);
    component = fixture.componentInstance;
    component.license = {
      info: {
        email: 'someEmail',
        installation_id: 'someId',
        name: 'someName',
        phone: 'somePhone',
      },
    };
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
