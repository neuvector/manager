import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreInstructionComponent } from './score-instruction.component';

describe('ScoreInstructionComponent', () => {
  let component: ScoreInstructionComponent;
  let fixture: ComponentFixture<ScoreInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreInstructionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
