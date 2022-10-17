import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsPrintableReportBarChartComponent } from './risk-reports-printable-report-bar-chart.component';

describe('RiskReportsPrintableReportBarChartComponent', () => {
  let component: RiskReportsPrintableReportBarChartComponent;
  let fixture: ComponentFixture<RiskReportsPrintableReportBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskReportsPrintableReportBarChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      RiskReportsPrintableReportBarChartComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
