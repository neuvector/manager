import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementServiceRiskViewComponent } from './score-improvement-service-risk-view.component';

describe('ScoreImprovementServiceRiskViewComponent', () => {
  let component: ScoreImprovementServiceRiskViewComponent;
  let fixture: ComponentFixture<ScoreImprovementServiceRiskViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScoreImprovementServiceRiskViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementServiceRiskViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
