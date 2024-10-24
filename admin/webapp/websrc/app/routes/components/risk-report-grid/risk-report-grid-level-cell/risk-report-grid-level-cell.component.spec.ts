import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridLevelCellComponent } from './risk-report-grid-level-cell.component';

describe('RiskReportGridLevelCellComponent', () => {
  let component: RiskReportGridLevelCellComponent;
  let fixture: ComponentFixture<RiskReportGridLevelCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskReportGridLevelCellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridLevelCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
