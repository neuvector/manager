import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScorePredictionHeaderComponent } from './score-prediction-header.component';

describe('ScorePredictionHeaderComponent', () => {
  let component: ScorePredictionHeaderComponent;
  let fixture: ComponentFixture<ScorePredictionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScorePredictionHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScorePredictionHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
