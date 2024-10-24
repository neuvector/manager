import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskViewReportDescriptionColComponent } from './risk-view-report-description-col.component';

describe('RiskViewReportDescriptionColComponent', () => {
  let component: RiskViewReportDescriptionColComponent;
  let fixture: ComponentFixture<RiskViewReportDescriptionColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RiskViewReportDescriptionColComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskViewReportDescriptionColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
