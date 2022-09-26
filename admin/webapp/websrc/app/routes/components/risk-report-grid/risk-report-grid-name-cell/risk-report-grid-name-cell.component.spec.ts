import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportGridNameCellComponent } from './risk-report-grid-name-cell.component';

describe('RiskReportGridNameCellComponent', () => {
  let component: RiskReportGridNameCellComponent;
  let fixture: ComponentFixture<RiskReportGridNameCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportGridNameCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskReportGridNameCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
