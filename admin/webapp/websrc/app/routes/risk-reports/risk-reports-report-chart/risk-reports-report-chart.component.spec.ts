import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsReportChartComponent } from './risk-reports-report-chart.component';

describe('RiskReportsReportChartComponent', () => {
  let component: RiskReportsReportChartComponent;
  let fixture: ComponentFixture<RiskReportsReportChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportsReportChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportsReportChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
