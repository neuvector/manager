import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CspLicenseConfigModalComponent } from './csp-license-config-modal.component';

describe('CspLicenseConfigModalComponent', () => {
  let component: CspLicenseConfigModalComponent;
  let fixture: ComponentFixture<CspLicenseConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CspLicenseConfigModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CspLicenseConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
