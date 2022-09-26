import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementCompletedViewComponent } from './score-improvement-completed-view.component';

describe('ScoreImprovementCompletedViewComponent', () => {
  let component: ScoreImprovementCompletedViewComponent;
  let fixture: ComponentFixture<ScoreImprovementCompletedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementCompletedViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementCompletedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
