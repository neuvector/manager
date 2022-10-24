import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsPrintableReportComponent } from './risk-reports-printable-report.component';

describe('RiskReportsPrintableReportComponent', () => {
  let component: RiskReportsPrintableReportComponent;
  let fixture: ComponentFixture<RiskReportsPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportsPrintableReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportsPrintableReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
