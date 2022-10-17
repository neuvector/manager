import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportsPrintableReportLocationColComponent } from './risk-reports-printable-report-location-col.component';

describe('RiskReportsPrintableReportLocationColComponent', () => {
  let component: RiskReportsPrintableReportLocationColComponent;
  let fixture: ComponentFixture<RiskReportsPrintableReportLocationColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportsPrintableReportLocationColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportsPrintableReportLocationColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
