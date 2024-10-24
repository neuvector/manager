import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportTableComponent } from './risk-view-report-table.component';

describe('RiskViewReportTableComponent', () => {
  let component: RiskViewReportTableComponent;
  let fixture: ComponentFixture<RiskViewReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskViewReportTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
