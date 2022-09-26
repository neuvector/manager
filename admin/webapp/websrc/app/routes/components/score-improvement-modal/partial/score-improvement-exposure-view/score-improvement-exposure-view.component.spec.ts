import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementExposureViewComponent } from './score-improvement-exposure-view.component';

describe('ScoreImprovementExposureViewComponent', () => {
  let component: ScoreImprovementExposureViewComponent;
  let fixture: ComponentFixture<ScoreImprovementExposureViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementExposureViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementExposureViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
