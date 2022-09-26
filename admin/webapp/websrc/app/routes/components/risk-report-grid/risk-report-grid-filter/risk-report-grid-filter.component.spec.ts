import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridFilterComponent } from './risk-report-grid-filter.component';

describe('RiskReportGridFilterComponent', () => {
  let component: RiskReportGridFilterComponent;
  let fixture: ComponentFixture<RiskReportGridFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportGridFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
