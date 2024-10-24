import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridMessageCellComponent } from './risk-report-grid-message-cell.component';

describe('RiskReportGridMessageCellComponent', () => {
  let component: RiskReportGridMessageCellComponent;
  let fixture: ComponentFixture<RiskReportGridMessageCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskReportGridMessageCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridMessageCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
