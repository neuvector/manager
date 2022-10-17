import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskReportsPrintableReportPieChartComponent } from './risk-reports-printable-report-pie-chart.component';

describe('RiskReportsPrintableReportPieChartComponent', () => {
  let component: RiskReportsPrintableReportPieChartComponent;
  let fixture: ComponentFixture<RiskReportsPrintableReportPieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskReportsPrintableReportPieChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      RiskReportsPrintableReportPieChartComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
