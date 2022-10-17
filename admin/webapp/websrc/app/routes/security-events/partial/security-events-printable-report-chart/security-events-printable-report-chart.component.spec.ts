import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEventsPrintableReportChartComponent } from './security-events-printable-report-chart.component';

describe('SecurityEventsPrintableReportChartComponent', () => {
  let component: SecurityEventsPrintableReportChartComponent;
  let fixture: ComponentFixture<SecurityEventsPrintableReportChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityEventsPrintableReportChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityEventsPrintableReportChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
