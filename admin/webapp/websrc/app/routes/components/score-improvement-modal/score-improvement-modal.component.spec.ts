import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementModalComponent } from './score-improvement-modal.component';

describe('ScoreImprovementModalComponent', () => {
  let component: ScoreImprovementModalComponent;
  let fixture: ComponentFixture<ScoreImprovementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScoreImprovementModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
