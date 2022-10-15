import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportSeverityColComponent } from './security-events-printable-report-severity-col.component';

describe('SecurityEventsPrintableReportSeverityColComponent', () => {
  let component: SecurityEventsPrintableReportSeverityColComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportSeverityColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsPrintableReportSeverityColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPrintableReportSeverityColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
