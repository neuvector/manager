import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsPrintableReportDetailColComponent } from './risk-reports-printable-report-detail-col.component';

describe('RiskReportsPrintableReportDetailColComponent', () => {
  let component: RiskReportsPrintableReportDetailColComponent;
  let fixture: ComponentFixture<RiskReportsPrintableReportDetailColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportsPrintableReportDetailColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportsPrintableReportDetailColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
