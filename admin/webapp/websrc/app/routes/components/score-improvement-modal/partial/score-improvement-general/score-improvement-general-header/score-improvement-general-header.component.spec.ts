import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreImprovementGeneralHeaderComponent } from './score-improvement-general-header.component';

describe('ScoreImprovementGeneralHeaderComponent', () => {
  let component: ScoreImprovementGeneralHeaderComponent;
  let fixture: ComponentFixture<ScoreImprovementGeneralHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreImprovementGeneralHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreImprovementGeneralHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
