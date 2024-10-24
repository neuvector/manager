import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportControlColComponent } from './risk-view-report-control-col.component';

describe('RiskViewReportControlColComponent', () => {
  let component: RiskViewReportControlColComponent;
  let fixture: ComponentFixture<RiskViewReportControlColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskViewReportControlColComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportControlColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
