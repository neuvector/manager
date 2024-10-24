import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportComponent } from './security-events-printable-report.component';

describe('SecurityEventsPrintableReportComponent', () => {
  let component: SecurityEventsPrintableReportComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityEventsPrintableReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPrintableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
