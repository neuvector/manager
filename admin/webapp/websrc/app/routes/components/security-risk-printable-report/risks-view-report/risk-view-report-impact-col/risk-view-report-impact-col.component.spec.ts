import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportImpactColComponent } from './risk-view-report-impact-col.component';

describe('RiskViewReportImpactColComponent', () => {
  let component: RiskViewReportImpactColComponent;
  let fixture: ComponentFixture<RiskViewReportImpactColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskViewReportImpactColComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportImpactColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
