import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridComponent } from './risk-report-grid.component';

describe('RiskReportGridComponent', () => {
  let component: RiskReportGridComponent;
  let fixture: ComponentFixture<RiskReportGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
