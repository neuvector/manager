import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridLocationCellComponent } from './risk-report-grid-location-cell.component';

describe('RiskReportGridLocationCellComponent', () => {
  let component: RiskReportGridLocationCellComponent;
  let fixture: ComponentFixture<RiskReportGridLocationCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportGridLocationCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridLocationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
