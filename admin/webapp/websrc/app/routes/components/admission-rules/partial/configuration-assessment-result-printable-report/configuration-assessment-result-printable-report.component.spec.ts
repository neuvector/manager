import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationAssessmentResultPrintableReportComponent } from './configuration-assessment-result-printable-report.component';

describe('ConfigurationAssessmentResultPrintableReportComponent', () => {
  let component: ConfigurationAssessmentResultPrintableReportComponent;
  let fixture: ComponentFixture<ConfigurationAssessmentResultPrintableReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationAssessmentResultPrintableReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ConfigurationAssessmentResultPrintableReportComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
