import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementGeneralComponent } from './score-improvement-general.component';

describe('ScoreImprovementGeneralComponent', () => {
  let component: ScoreImprovementGeneralComponent;
  let fixture: ComponentFixture<ScoreImprovementGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementGeneralComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
