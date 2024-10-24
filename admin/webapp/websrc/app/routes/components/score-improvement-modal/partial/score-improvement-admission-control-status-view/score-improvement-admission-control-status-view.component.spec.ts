import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementAdmissionControlStatusViewComponent } from './score-improvement-admission-control-status-view.component';

describe('ScoreImprovementAdmissionControlStatusViewComponent', () => {
  let component: ScoreImprovementAdmissionControlStatusViewComponent;
  let fixture: ComponentFixture<ScoreImprovementAdmissionControlStatusViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScoreImprovementAdmissionControlStatusViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ScoreImprovementAdmissionControlStatusViewComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
